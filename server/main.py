import asyncio
import socket
import logging
import sys
from typing import AsyncIterable
import websockets
from websockets.server import WebSocketServerProtocol
import struct
import argparse

from authenticator import Authenticator
from dispatcher import Dispatcher
from network_handler import NetworkHandlerAdapter

logging.basicConfig()
logging.root.setLevel(logging.INFO)


DEFAULT_IDE_TCP_PORT = 8501
DEFAULT_IDE_WEBSOCKET_PORT = 8502
DEFAULT_FRONTEND_WEBSOCKET_PORT = 8503


async def get_stdin_lines() -> AsyncIterable[str]:
    loop = asyncio.get_event_loop()
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        yield line


def port_type(astr, min=1, max=65536):
    value = int(astr)
    if min <= value <= max:
        return value
    else:
        raise argparse.ArgumentTypeError(f'value not in range [{min}-{max}]')

def handle_args(args):
    global dump_messages, multi_user_mode

    if len(set([args.frontend_port, args.backend_tcp_port, args.backend_websocket_port])) != 3:
        print("Each provided port must be unique")
        exit(1)
    
    if args.dump:
        dump_messages = True
    if args.multi_user_mode:
        multi_user_mode = True

async def main():
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("--dump", help="Dump the network traffic to output", action="store_true")
    parser.add_argument("--frontend-port", help="The port for communication with the frontend", default=DEFAULT_FRONTEND_WEBSOCKET_PORT, type=port_type, metavar="[1-65535]")
    parser.add_argument("--backend-tcp-port", help="The port for communication with TCP backends", default=DEFAULT_IDE_TCP_PORT, type=port_type, metavar="[1-65535]")
    parser.add_argument("--backend-websocket-port", help="The port for communication with Websocket backends", default=DEFAULT_IDE_WEBSOCKET_PORT, type=port_type, metavar="[1-65535]")
    parser.add_argument('--multi-user-mode', help="Support multiple users at the same time by authenticating with uuid", action="store_true")
    args = parser.parse_args()
    handle_args(args)

    dispatcher = Dispatcher(args.dump)
    authenticator = Authenticator(dispatcher, args.multi_user_mode)
    adapter = NetworkHandlerAdapter(authenticator)

    print(f"Serving - frontend at {args.frontend_port} , TCP backend at {args.backend_tcp_port} , Websocket backend at {args.backend_websocket_port}")
    async with websockets.serve(adapter.handle_frontend_ws, "0.0.0.0", args.frontend_port):
        async with await asyncio.start_server(adapter.handle_backend_tcp, '0.0.0.0', args.backend_tcp_port):
            async with websockets.serve(adapter.handle_backend_ws, "0.0.0.0", args.backend_websocket_port):
                async for _ in get_stdin_lines():  
                    print("Current status:")                  
                    print(repr(dispatcher))


asyncio.run(main())
