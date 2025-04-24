import logging
import threading
import tornado.web
import tornado.ioloop
from typing import Dict, Any, Optional
from perspective import Server, Table
from perspective.handlers.tornado import PerspectiveTornadoHandler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(process)d [%(threadName)s] %(levelname)s: %(message)s"
)

ORDER_BOOK_SCHEMA: Dict[str, Any] = {
    "depth": str,
    "side": str,
    "price": float,
    "amount": float
}


class PerspectiveServer:
    def __init__(self, table_name: str = "orderbook", port: int = 5001):
        self.table_name = table_name
        self.port = port
        self._stop_event = threading.Event()
        self._ioloop: Optional[tornado.ioloop.IOLoop] = tornado.ioloop.IOLoop().current()
        self._thread: Optional[threading.Thread] = None

        self.server = Server()
        self.client = self.server.new_local_client()
        self.table = self.client.table(
            ORDER_BOOK_SCHEMA,
            name=self.table_name,
            index="depth"
        )

        logging.info(f"Perspective Table '{self.table_name}' created with index 'depth'.")

    def setup_routes(self) -> None:
        try:
            app = tornado.web.Application([
                (r"/orderbook", PerspectiveTornadoHandler, {
                    "perspective_server": self.server
                }),
            ])
            app.listen(self.port)
            logging.info(f"Tornado server listening on port {self.port}...")

        except Exception as e:
            logging.error(f"Error while running Tornado server: {e}")

    def _run_server(self) -> None:
        """Run the Tornado app and IOLoop."""
        try:
            self._ioloop.start()
        except RuntimeError as e:
            logging.warning(f"IOLoop already running? Encountered: {e}")

    def start(self) -> None:
        """Starts the Perspective server in a new thread."""
        if self._thread and self._thread.is_alive():
            logging.warning("Perspective server already running.")
            return

        logging.info("Starting Perspective server...")
        self._stop_event.clear()

        self._thread = threading.Thread(target=self._run_server, name="PerspectiveServerThread", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Stops the server gracefully."""
        logging.info("Stopping Perspective server...")

        if self._ioloop and self._ioloop.running():
            logging.info("Scheduling IOLoop stop.")
            self._ioloop.add_callback(self._ioloop.stop)

        if self._thread:
            logging.debug("Waiting for server thread to join...")
            self._thread.join(timeout=5)
            if self._thread.is_alive():
                logging.warning("Server thread did not terminate cleanly.")

        self._stop_event.set()
        logging.info("Perspective server stopped.")

    def get_table(self) -> Table:
        """Returns the Perspective Table instance."""
        return self.table

    def get_loop(self) -> tornado.ioloop.IOLoop:
        """Returns the IOLoop instance, if initialized."""
        if not self._ioloop:
            raise RuntimeError("IOLoop not initialized yet. Call start() first.")
        return self._ioloop