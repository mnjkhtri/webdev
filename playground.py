import asyncio
import websockets

async def receive_messages(websocket):
    try:
        while True:
            msg = await websocket.recv()
            print("Received:", msg)
    except websockets.exceptions.ConnectionClosed:
        print("WebSocket connection closed.")

async def send_messages(websocket):
    # Send a few messages to the server
    for i in range(5):
        message = f"Hello {i}"
        await websocket.send(message)
        print("Sent:", message)
        await asyncio.sleep(3)  # wait a bit between messages
    # After sending messages, close the connection
    await websocket.close()

async def test_websocket():
    # Replace with your server's address if needed.
    uri = "ws://localhost:8000/ws/test/testclient"
    async with websockets.connect(uri) as websocket:
        print("Connected to the WebSocket server.")
        # Run sending and receiving concurrently.
        receive_task = asyncio.create_task(receive_messages(websocket))
        send_task = asyncio.create_task(send_messages(websocket))
        await asyncio.gather(receive_task, send_task)

if __name__ == "__main__":
    asyncio.run(test_websocket())