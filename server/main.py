import asyncio
import socket
import logging
from typing import List, Tuple
import websockets
from websockets.server import WebSocketServerProtocol
import struct
import argparse

logging.basicConfig()
logging.root.setLevel(logging.INFO)

DEFAULT_IDE_TCP_PORT = 8501
DEFAULT_IDE_WEBSOCKET_PORT = 8502
DEFAULT_FRONTEND_WEBSOCKET_PORT = 8503

frontend_wss: List[WebSocketServerProtocol] = []
ide_wss: List[WebSocketServerProtocol] = []
ide_tcps: List[Tuple[asyncio.StreamReader, asyncio.StreamWriter]] = []

dump_messages = False


async def send_frontend(request: str, src):
    if dump_messages:
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
    if dump_messages:
        logging.warning(f"Received pull from {src}")
        logging.info(f"pull: {request}")

    # We duplicate the lists, to prevent modification of the lists while we use it. 
    # handle_ide_X are reponsible for cleaning the lists in case of a closed socket.

    request_bytes = request.encode('utf-8')
    for _, writer in ide_tcps[:]:
        try:
            writer.write(struct.pack('>i', len(request_bytes)))
            writer.write(request_bytes)
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


def port_type(astr, min=1, max=65536):
    value = int(astr)
    if min <= value <= max:
        return value
    else:
        raise argparse.ArgumentTypeError(f'value not in range [{min}-{max}]')

def handle_args(args):
    global dump_messages

    if len(set([args.frontend_port, args.backend_tcp_port, args.backend_websocket_port])) != 3:
        print("Each provided port must be unique")
        exit(1)
    
    if args.dump:
        dump_messages = True

async def main():
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("--dump", help="Dump the network traffic to output", action="store_true")
    parser.add_argument("--frontend-port", help="The port for communication with the frontend", default=DEFAULT_FRONTEND_WEBSOCKET_PORT, type=port_type, metavar="[1-65535]")
    parser.add_argument("--backend-tcp-port", help="The port for communication with TCP backends", default=DEFAULT_IDE_TCP_PORT, type=port_type, metavar="[1-65535]")
    parser.add_argument("--backend-websocket-port", help="The port for communication with Websocket backends", default=DEFAULT_IDE_WEBSOCKET_PORT, type=port_type, metavar="[1-65535]")
    args = parser.parse_args()
    handle_args(args)

    print(f"Serving - frontend at {args.frontend_port} , TCP backend at {args.backend_tcp_port} , Websocket backend at {args.backend_websocket_port}")
    async with websockets.serve(handle_frontend, "0.0.0.0", args.frontend_port):
        async with await asyncio.start_server(handle_ide_tcp, '0.0.0.0', args.backend_tcp_port):
            async with websockets.serve(handle_ide_websocket, "0.0.0.0", args.backend_websocket_port):
                # run forever
                await asyncio.Future()  


asyncio.run(main())
