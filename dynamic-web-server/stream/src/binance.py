import logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(process)d [%(threadName)s] %(levelname)s: %(message)s"
)
import requests
import json
import ssl
import threading
from collections import deque
from typing import Dict, List, Tuple, Optional, Any
from websocket import WebSocketApp
from sortedcontainers import SortedDict


# Define type aliases for clarity
Price = float
Amount = float
PriceLevel = Tuple[Price, Amount]
OrderBookSide = SortedDict # Type alias for the SortedDict structure used for bids/asks


class BinanceOrderBook:
    """
    Maintains a real-time order book for a given symbol on Binance
    using WebSocket updates and an initial REST API snapshot.

    Follows Binance's recommended practices for managing differential depth streams:
    1. Connect to WebSocket stream.
    2. Buffer incoming depth events.
    3. Get depth snapshot via REST API.
    4. Process buffered events that occurred during snapshot fetch,
       ensuring continuity using `U`, `u`, and `lastUpdateId`.
    5. Continuously process incoming WebSocket events.
    """
    _BASE_WSS_URL = "wss://stream.binance.com:9443/ws"
    _BASE_API_URL = "https://api.binance.com/api/v3"

    def __init__(self, symbol: str = "BTCUSDT", snapshot_limit: int = 1000):
        """
        Initializes the BinanceOrderBook instance.

        Args:
            symbol (str): The trading symbol (e.g., "BTCUSDT").
            snapshot_limit (int): The number of levels for the initial snapshot (max 1000).
        """
        if not isinstance(symbol, str) or not symbol:
            raise ValueError("Symbol must be a non-empty string.")
        if not isinstance(snapshot_limit, int) or not (0 < snapshot_limit <= 1000):
             raise ValueError("Snapshot limit must be an integer between 1 and 1000.")

        self.symbol = symbol.upper()
        self.snapshot_limit = snapshot_limit
        self._stream_url = f"{self._BASE_WSS_URL}/{self.symbol.lower()}@depth"
        self._snapshot_url = f"{self._BASE_API_URL}/depth"

        # Use SortedDict for efficient sorted operations.
        # Bids are sorted descending by price (highest bid first).
        # Asks are sorted ascending by price (lowest ask first).
        self.bids: OrderBookSide = SortedDict(lambda k: -Price(k))
        self.asks: OrderBookSide = SortedDict(lambda k: Price(k))

        self.last_update_id: Optional[int] = None # Last update ID from the snapshot or stream
        self._ws: Optional[WebSocketApp] = None
        self._ws_thread: Optional[threading.Thread] = None

        # State management for initialization synchronization
        self._is_buffering: bool = True # Start in buffering state
        self._message_queue: deque = deque() # Queue for messages arriving during snapshot fetch
        self._lock = threading.Lock() # Lock for thread-safe access to order book data
        self._stop_event = threading.Event() # Event to signal stopping

    def _fetch_depth_snapshot(self) -> None:
        """Fetches the initial order book snapshot via REST API."""
        logging.info(f"Fetching depth snapshot for {self.symbol} (limit: {self.snapshot_limit})...")
        params = {"symbol": self.symbol, "limit": self.snapshot_limit}
        try:
            response = requests.get(self._snapshot_url, params=params, timeout=10) # Added timeout
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            snapshot_data = response.json()
            logging.info(f"Snapshot received. Last Update ID: {snapshot_data['lastUpdateId']}")

        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to fetch snapshot: {e}")
            raise ConnectionError(f"Failed to fetch snapshot: {e}") from e
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse snapshot JSON: {e}")
            raise ValueError(f"Failed to parse snapshot JSON: {e}") from e
        except KeyError as e:
             logging.error(f"Snapshot JSON missing expected key: {e}")
             raise ValueError(f"Snapshot JSON missing expected key: {e}") from e

        with self._lock:
            self.last_update_id = int(snapshot_data['lastUpdateId'])

            # Initialize bids, ignoring levels with zero amount
            snapshot_bids: List[List[str]] = snapshot_data.get('bids', [])
            for price_str, amount_str in snapshot_bids:
                price, amount = Price(price_str), Amount(amount_str)
                if amount > 0:
                    self.bids[price] = amount

            # Initialize asks, ignoring levels with zero amount
            snapshot_asks: List[List[str]] = snapshot_data.get('asks', [])
            for price_str, amount_str in snapshot_asks:
                price, amount = Price(price_str), Amount(amount_str)
                if amount > 0:
                    self.asks[price] = amount

            logging.info(f"Snapshot processed. Bids: {len(self.bids)}, Asks: {len(self.asks)}")

    def _process_buffered_messages(self) -> None:
        """Processes messages buffered during the snapshot fetch."""
        logging.debug("Processing buffered messages...")

        with self._lock:
            while self._message_queue:
                msg_str = self._message_queue.popleft()
                try:
                    msg_data = json.loads(msg_str)
                    event_type = msg_data.get('e')
                    if event_type != 'depthUpdate':
                        logging.debug(f"Skipping non-depthUpdate buffered message: {event_type}")
                        continue

                    first_update_id = int(msg_data['U'])
                    final_update_id = int(msg_data['u'])

                    # Logic from Binance docs:
                    # Drop update if u <= lastUpdateId
                    if final_update_id <= self.last_update_id:
                        logging.debug(f"Dropping old buffered update: u={final_update_id} <= lastUpdateId={self.last_update_id}")
                        continue

                    # Apply update if U <= lastUpdateId+1 AND u >= lastUpdateId+1
                    if first_update_id <= self.last_update_id + 1 and final_update_id >= self.last_update_id + 1:
                        logging.debug(f"Applying buffered update: U={first_update_id}, u={final_update_id}, lastUpdateId={self.last_update_id}")
                        self._apply_update(msg_data)
                        self.last_update_id = final_update_id # Update last_update_id *after* successful application
                    else:
                         logging.warning(f"Buffered update out of sequence? U={first_update_id}, u={final_update_id}, lastUpdateId={self.last_update_id}")

                except json.JSONDecodeError:
                    logging.error(f"Failed to parse buffered JSON message: {msg_str[:100]}...")
                except (KeyError, ValueError) as e:
                    logging.error(f"Error processing buffered message: {e} - Data: {msg_str[:100]}...")

            # Buffering finished, switch to real-time processing
            self._is_buffering = False
            logging.info("Finished processing buffered messages. Switching to real-time updates.")

    def _apply_update(self, update_data: Dict[str, Any]) -> None:
        """Applies a single depth update message to the order book."""
        # Assumes lock is already held by caller (_process_buffered_messages or _on_message)
        try:
            # Update bids
            update_bids: List[List[str]] = update_data.get('b', [])
            for price_str, amount_str in update_bids:
                price, amount = Price(price_str), Amount(amount_str)
                if amount == 0:
                    self.bids.pop(price, None) # Remove price level if amount is 0
                else:
                    self.bids[price] = amount

            # Update asks
            update_asks: List[List[str]] = update_data.get('a', [])
            for price_str, amount_str in update_asks:
                price, amount = Price(price_str), Amount(amount_str)
                if amount == 0:
                    self.asks.pop(price, None) # Remove price level if amount is 0
                else:
                    self.asks[price] = amount

        except (KeyError, ValueError) as e:
             logging.error(f"Error applying update: {e} - Data: {update_data}")

    def _on_message(self, ws: WebSocketApp, message: str) -> None:
        """Handles incoming WebSocket messages."""
        if self._stop_event.is_set():
            return

        with self._lock:
            if self._is_buffering:
                # Queue messages if we are still waiting for/processing the snapshot
                self._message_queue.append(message)
                # logging.debug(f"Queued message, queue size: {len(self._message_queue)}")
                return

            # If not buffering, process the message immediately
            try:
                msg_data = json.loads(message)
                event_type = msg_data.get('e')
                if event_type != 'depthUpdate':
                    logging.debug(f"Skipping non-depthUpdate message: {event_type}")
                    return

                # Important: Check sequence continuity for real-time updates
                final_update_id = int(msg_data['u'])
                prev_final_update_id = msg_data.get('pu') # Previous update's final ID

                # If it's the first message after buffering, check using the same logic
                if self.last_update_id is not None and final_update_id <= self.last_update_id:
                    logging.debug(f"Dropping old real-time update: u={final_update_id} <= lastUpdateId={self.last_update_id}")
                    return

                # Optional stricter check: Check if 'pu' matches the last processed 'u'
                # This helps detect missed messages, although TCP usually ensures order.
                if prev_final_update_id is not None and int(prev_final_update_id) != self.last_update_id:
                   logging.warning(f"Gap detected! pu={prev_final_update_id} != last_update_id={self.last_update_id}. Resync might be needed.")

                # Apply the update
                self._apply_update(msg_data)
                self.last_update_id = final_update_id # Update last_update_id *after* successful application

            except json.JSONDecodeError:
                logging.error(f"Failed to parse real-time JSON message: {message[:100]}...")
            except (KeyError, ValueError) as e:
                logging.error(f"Error processing real-time message: {e} - Data: {message[:100]}...")

    def _on_close(self, ws: WebSocketApp, close_status_code: Optional[int], close_msg: Optional[str]) -> None:
        """Handles WebSocket connection close."""
        if not self._stop_event.is_set():
             logging.warning(f"WebSocket closed: Status={close_status_code}, Msg={close_msg}")
        else:
             logging.info("WebSocket connection closed normally.")

    def _on_open(self, ws: WebSocketApp) -> None:
        """Handles WebSocket connection open."""
        logging.info("WebSocket connection opened.")
        # Connection is open, now fetch the snapshot in the main thread

    def _on_error(self, ws: WebSocketApp, error: Exception) -> None:
        """Handles WebSocket errors."""
        logging.error(f"WebSocket error: {error}")
        # Consider adding reconnection logic here or signaling failure

    def _run_websocket(self) -> None:
        """Runs the WebSocketApp in a loop."""
        logging.info(f"Connecting to WebSocket stream: {self._stream_url}")
        self._ws = WebSocketApp(
            self._stream_url,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close
        )
        # Run forever until ws.close() is called or an unhandled error occurs
        # Disable SSL verification if needed (e.g., corporate proxies), but be aware of security implications.
        # Use sslopt={"cert_reqs": ssl.CERT_NONE} cautiously.
        self._ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})
        logging.info("WebSocket run_forever loop exited.")

    def start(self) -> None:
        """Starts the WebSocket connection and initiates the order book synchronization."""
        if self._ws_thread and self._ws_thread.is_alive():
            logging.warning("Order book process already running.")
            return

        logging.info("Starting Binance Order Book...")
        self._stop_event.clear()
        self._is_buffering = True # Ensure buffering is active initially
        self._message_queue.clear() # Clear any old messages

        # Start WebSocket in a separate thread
        self._ws_thread = threading.Thread(target=self._run_websocket, name="OrderBookDiffThread", daemon=True)
        self._ws_thread.start()

        # Fetch snapshot and process buffer
        try:
            self._fetch_depth_snapshot()
            self._process_buffered_messages()
            logging.info("Order book synchronization complete. Tracking real-time updates.")
        except (ConnectionError, ValueError) as e:
            logging.error(f"Failed to initialize order book: {e}. Stopping.")
            self.stop()
            raise

    def stop(self) -> None:
        """Stops the WebSocket connection and shuts down gracefully."""
        logging.info("Stopping Binance Order Book...")
        self._stop_event.set()

        if self._ws:
            self._ws.close()

        if self._ws_thread and self._ws_thread.is_alive():
            logging.debug("Waiting for WebSocket thread to join...")
            self._ws_thread.join(timeout=5)
            if self._ws_thread.is_alive():
                 logging.warning("WebSocket thread did not join cleanly.")

        logging.info("Binance Order Book stopped.")


    # --- Public methods ---

    def get_bids(self, limit: int = 10) -> List[PriceLevel]:
        """Returns the top N bid levels."""
        with self._lock:
            # Items are returned in sorted order (highest price first due to key func)
            return list(self.bids.items()[:limit])

    def get_asks(self, limit: int = 10) -> List[PriceLevel]:
        """Returns the top N ask levels."""
        with self._lock:
             # Items are returned in sorted order (lowest price first)
            return list(self.asks.items()[:limit])

    def get_spread(self) -> Optional[Tuple[Price, Price]]:
        """Returns the best bid and best ask."""
        with self._lock:
            best_bid = self.bids.peekitem(0)[0] if self.bids else None
            best_ask = self.asks.peekitem(0)[0] if self.asks else None
            if best_bid is not None and best_ask is not None:
                return best_bid, best_ask
            return None