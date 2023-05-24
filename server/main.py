import asyncio
import socket
import logging
from typing import List, Tuple
import websockets
from websockets.server import WebSocketServerProtocol
import struct

logging.basicConfig()
logging.root.setLevel(logging.INFO)

IDE_TCP_PORT = 8501
IDE_WEBSOCKET_PORT = 8502
FRONTEND_WEBSOCKET_PORT = 8503

frontend_wss: List[WebSocketServerProtocol] = []
ide_wss: List[WebSocketServerProtocol] = []
ide_tcps: List[Tuple[asyncio.StreamReader, asyncio.StreamWriter]] = []


async def send_frontend(request: str, src):
    logging.warning(f"Received push from {src}")
    logging.info(f"Push: {request}")

    # We duplicate the list, to prevent modification of the list while we use it. 
    # handle_frontend is reponsible for cleaning the list in case of a closed socket.
    for websocket in frontend_wss[:]:
        try:
            await websocket.send(request)
        except websockets.exceptions.ConnectionClosed:
            logging.info(f"[WS] Frontend Connection from {websocket.remote_address} is closed, and was yet to be cleaned from the list")

async def send_ide(request: str, src):
    logging.warning(f"Received pull from {src}")
    logging.info(f"pull: {request}")

    # We duplicate the lists, to prevent modification of the lists while we use it. 
    # handle_ide_X are reponsible for cleaning the lists in case of a closed socket.

    for _, writer in ide_tcps[:]:
        try:
            writer.write(struct.pack('>i', len(request)))
            writer.write(request.encode('utf-8'))
            await writer.drain()

        except socket.error:
            logging.info(f"[TCP] IDE Connection from {writer.get_extra_info('peername')} is closed, and was yet to be cleaned from the list")

    for websocket in ide_wss[:]:
        try:
            await websocket.send((request + "\n"))
        except websockets.exceptions.ConnectionClosed:
            logging.info(f"[WS] IDE Connection from {websocket.remote_address} is closed, and was yet to be cleaned from the list")


async def handle_ide_tcp(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    # Print connection info
    peer = writer.get_extra_info('peername')
    logging.warning(f"[TCP] Handling IDE Connection from {peer}")

    # Save the connection
    ide_tcps.append((reader, writer))

    while True:
        try:
            length = struct.unpack('>i', (await reader.readexactly(4)))[0]
            if length < 0 or length > 65536:
                logging.error(f"Length is too big: {length}, aborting. It might be because of an older backend script...")
                raise ConnectionResetError()

            push = (await reader.readexactly(length)).decode('utf8')
            if not push:
                logging.warning(f"[TCP] IDE Connection from {peer} is closed")
                ide_tcps.remove((reader, writer))
                break

            # Handle push
            await send_frontend(push, peer)
        except (ConnectionResetError, asyncio.IncompleteReadError):
            logging.warning(f"[TCP] IDE Connection from {peer} is closed")
            ide_tcps.remove((reader, writer))
            break

async def handle_ide_websocket(websocket: WebSocketServerProtocol):
    # Print connection info
    peer = websocket.remote_address
    logging.warning(f"[WS] Handling IDE Connection from {peer}")

    # Save the connection
    ide_wss.append(websocket)

    try:
        while True:
            push = await websocket.recv()
            # Handle push
            await send_frontend(push, peer)
    except websockets.exceptions.ConnectionClosed:
        logging.warning(f"[WS] IDE Connection from {peer} is closed")
        ide_wss.remove(websocket)
    
async def handle_frontend(websocket: WebSocketServerProtocol):
    peer = websocket.remote_address
    logging.warning(f"[WS] Handling Frontend Connection from {peer}")
    frontend_wss.append(websocket)

    try:
        while True:
            msg = await websocket.recv()
            await send_ide(msg, peer)

    except websockets.exceptions.ConnectionClosed:
        logging.warning(f"[WS] Frontend Connection from {peer} is closed")
        frontend_wss.remove(websocket)


async def main():
    async with websockets.serve(handle_frontend, "0.0.0.0", FRONTEND_WEBSOCKET_PORT):
        async with await asyncio.start_server(handle_ide_tcp, '0.0.0.0', IDE_TCP_PORT):
            async with websockets.serve(handle_ide_websocket, "0.0.0.0", IDE_WEBSOCKET_PORT):
                # run forever
                await asyncio.Future()  


asyncio.run(main())
