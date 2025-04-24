import pandas as pd
import threading
import multiprocessing as mp
from src.binance import BinanceOrderBook
from src.perspective_server import PerspectiveServer
import logging
import signal

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(threadName)s - %(levelname)s: %(message)s")

BINANCE_SYMBOL = "BTCUSDT"
ORDER_BOOK_SNAPSHOT_LIMIT = 1000
TOP_N_LEVELS = 10
UPDATE_INTERVAL_SECONDS = 0.05

def main():
    """
    Initializes and runs the Binance Order Book fetcher, Perspective Server,
    and the data processing loop within a single main function scope.
    Handles graceful shutdown.
    """
    shutdown_event = threading.Event()
    signal.signal(signal.SIGINT, lambda signum, _: (logging.info(f"Received signal {signal.Signals(signum).name}. Initiating shutdown..."), shutdown_event.set()))

    order_book = None
    psp_server = None
    processor_thread = None

    def run_processor(
        current_order_book: BinanceOrderBook,
        current_psp_loop,
        current_psp_table,
        stop_event: threading.Event,
        levels: int,
        interval: float
    ):
        """
        Continuously fetches order book data, formats it, and schedules
        updates for the Perspective table via its event loop.
        (Defined inside main to avoid separate top-level function)
        """
        thread_name = threading.current_thread().name
        logging.info(f"Starting data processing loop in thread '{thread_name}'.")

        while not stop_event.is_set():
            try:
                if stop_event.is_set(): break

                # Fetch data
                bids = current_order_book.get_bids(levels)
                asks = current_order_book.get_asks(levels)

                if bids and asks:
                    bids_data = [
                        {"depth": f'b{i}', "side": "bid", "price": price, "amount": amount}
                        for i, (price, amount) in enumerate(bids)
                    ]
                    asks_data = [
                        {"depth": f'a{i}', "side": "ask", "price": price, "amount": amount}
                        for i, (price, amount) in enumerate(asks)
                    ]
                    update_data = bids_data + asks_data

                    if update_data:
                        current_psp_loop.add_callback(current_psp_table.update, update_data)
                        logging.debug(f"[{thread_name}] Scheduled update for {len(update_data)} rows.")
                    else:
                        logging.debug(f"[{thread_name}] No data formatted for update.")

                    # # ----
                    # logging.info("Inspecting Perspective table contents...")
                    # try:
                    #     view = current_psp_table.view()
                    #     table_data = view.to_records()
                    #     df = pd.DataFrame(table_data)
                    #     logging.info(df)
                    #     view.delete()
                    # except Exception as e:
                    #     logging.error(f"Failed to inspect perspective table: {e}")
                    # # ----

                elif not stop_event.is_set():
                    logging.warning(f"[{thread_name}] Order book data not available or empty. Retrying...")

            except Exception as e:
                if stop_event.is_set():
                    logging.info(f"[{thread_name}] Error during shutdown in processing loop, ignoring: {e}")
                    break
                else:
                    logging.error(f"[{thread_name}] Error processing order book data: {e}", exc_info=False)

            # Wait for the next interval or until shutdown is signaled
            if stop_event.wait(interval):
                break

        logging.info(f"Data processing loop finished in thread '{thread_name}'.")

    # Function to handle termination signals
    def signal_handler(signum, _):
        logging.info(f"Received signal {signal.Signals(signum).name}. Initiating shutdown...")
        shutdown_event.set()

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)

    try:
        # 1. Initialize Binance Order Book (a thread basically here?)
        logging.info(f"Initializing BinanceOrderBook for {BINANCE_SYMBOL}...")
        order_book = BinanceOrderBook(symbol=BINANCE_SYMBOL, snapshot_limit=ORDER_BOOK_SNAPSHOT_LIMIT)
        order_book.start()
        logging.info("BinanceOrderBook started.")

        # 2. Start Perspective Server IOLoop in a background thread
        logging.info("Initializing Perspective server.")
        psp_server = PerspectiveServer()
        psp_server.setup_routes()
        psp_server.start()

        psp_loop = psp_server.get_loop()
        psp_table = psp_server.get_table()

        # 3. Start the Data Processing Thread (using the nested function)
        logging.info("Starting data processor thread.")
        processor_thread = threading.Thread(
            target=run_processor,
            args=(order_book, psp_loop, psp_table, shutdown_event, TOP_N_LEVELS, UPDATE_INTERVAL_SECONDS),
            name="DataProcessorThread",
            daemon=False
        )
        processor_thread.start()

        logging.info("Application started. Press Ctrl+C to exit.")
        while not shutdown_event.is_set():
             shutdown_event.wait(timeout=1.0)

        logging.info("Shutdown signal received by main thread. Cleaning up...")

    except Exception as e:
        logging.error(f"An unexpected error occurred in main setup: {e}", exc_info=True)
        shutdown_event.set() # Ensure shutdown on error

    finally:
        logging.info("Starting final cleanup...")
        shutdown_event.set() # Ensure event is set for all threads

        # Wait for the data processor thread to exit first
        if processor_thread and processor_thread.is_alive():
            logging.info("Waiting for data processor thread to finish...")
            processor_thread.join(timeout=5.0)
            if processor_thread.is_alive(): 
                logging.warning("Data processor thread timed out.")

        # Stop the Perspective server thread
        if psp_server:
            logging.info("Stopping Perspective server...")
            try: 
                psp_server.stop()
            except Exception as e_stop: 
                logging.error(f"Error calling psp_server.stop(): {e_stop}")

        # Stop the order book fetcher
        logging.info("Stopping Binance order book...")
        try:
            order_book.stop()
        except Exception as e:
            logging.error(f"Error stopping order book: {e}", exc_info=True)

        logging.info("Cleanup complete. Main thread exiting.")

if __name__ == "__main__":

    main()

