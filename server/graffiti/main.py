import asyncio
import logging
import os
import sys
from typing import Any, AsyncContextManager, AsyncIterable, Callable, Coroutine, Optional
import websockets
from websockets.server import WebSocketServerProtocol
import argparse
import ssl

from .authenticator import Authenticator
from .dispatcher import Dispatcher
from .network_handler import NetworkHandlerAdapter

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


def port_type(astr: str, min: int = 1, max: int = 65536) -> int:
    value = int(astr)
    if min <= value <= max:
        return value
    else:
        raise argparse.ArgumentTypeError(f"value not in range [{min}-{max}]")


def file_type(astr: str) -> str:
    if os.path.exists(astr):
        return astr
    else:
        raise argparse.ArgumentTypeError("The provided path does not exist")


def handle_args(args):
    global dump_messages, multi_user_mode

    if len(set([args.frontend_port, args.backend_tcp_port, args.backend_websocket_port])) != 3:
        print("Each provided port must be unique")
        exit(1)

    if args.dump:
        dump_messages = True
    if args.multi_user_mode:
        multi_user_mode = True
    if args.debug:
        logging.root.setLevel(logging.DEBUG)


def serve_websocket(
    callback: Callable[[WebSocketServerProtocol], Coroutine[Any, Any, None]],
    bind_ip: str,
    bind_port: int,
    ssl_context: Optional[ssl.SSLContext] = None,
) -> AsyncContextManager:
    if ssl_context is not None:
        return websockets.serve(callback, bind_ip, bind_port, ssl=ssl_context)
    else:
        return websockets.serve(callback, bind_ip, bind_port)


async def main():
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("--dump", help="Dump the network traffic to output", action="store_true")
    parser.add_argument("--debug", help="Enable debug logs", action="store_true")
    parser.add_argument(
        "--frontend-port",
        help="The port for communication with the frontend",
        default=DEFAULT_FRONTEND_WEBSOCKET_PORT,
        type=port_type,
        metavar="[1-65535]",
    )
    parser.add_argument(
        "--backend-tcp-port",
        help="The port for communication with TCP backends",
        default=DEFAULT_IDE_TCP_PORT,
        type=port_type,
        metavar="[1-65535]",
    )
    parser.add_argument(
        "--backend-websocket-port",
        help="The port for communication with Websocket backends",
        default=DEFAULT_IDE_WEBSOCKET_PORT,
        type=port_type,
        metavar="[1-65535]",
    )
    parser.add_argument(
        "--frontend-tls-context",
        help="Chain and leaf to support WSS for frontend connection",
        default=None,
        nargs=2,
        type=file_type,
        metavar=("chain.crt", "leaf.key"),
    )
    parser.add_argument(
        "--multi-user-mode",
        help="Support multiple users at the same time by authenticating with uuid",
        action="store_true",
    )
    args = parser.parse_args()
    handle_args(args)

    dispatcher = Dispatcher(args.dump)
    authenticator = Authenticator(dispatcher, args.multi_user_mode)
    adapter = NetworkHandlerAdapter(authenticator)

    ssl_context = None
    if args.frontend_tls_context is not None:
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        chain, key = args.frontend_tls_context
        ssl_context.load_cert_chain(chain, key)

    print(
        f"Serving - frontend at {args.frontend_port} , TCP backend at {args.backend_tcp_port} , Websocket backend at {args.backend_websocket_port}"
    )
    async with serve_websocket(adapter.handle_frontend_ws, "0.0.0.0", args.frontend_port, ssl_context):
        async with await asyncio.start_server(adapter.handle_backend_tcp, "0.0.0.0", args.backend_tcp_port):
            async with serve_websocket(adapter.handle_backend_ws, "0.0.0.0", args.backend_websocket_port):
                async for _ in get_stdin_lines():
                    print("Current status:")
                    print(repr(dispatcher))


def main_cli():
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Closing the server.")
