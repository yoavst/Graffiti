import socket
import struct
from typing import Protocol
import websockets
from websockets.server import WebSocketServerProtocol
import asyncio
import logging

class SocketWrapper(Protocol):
    peername: str

    async def recv_msg(self) -> str:
        ...

    async def send_msg(self, msg: str):
        ...

    async def close(self):
        ...

    

    @staticmethod
    def wrap_asyncio(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> 'SocketWrapper':
        return AsyncioSocketWrapper(reader, writer)
    
    @staticmethod
    def wrap_websocket(websocket: WebSocketServerProtocol) -> 'SocketWrapper':
        return WebSocketSocketWraper(websocket)

class AsyncioSocketWrapper(SocketWrapper):
    def __init__(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        self.reader: asyncio.StreamReader = reader
        self.writer: asyncio.StreamWriter = writer
        self.peername: str = str(self.writer.get_extra_info('peername'))

    async def recv_msg(self) -> str:
        try:
            length = struct.unpack('>i', (await self.reader.readexactly(4)))[0]
            if length < 0 or length > 65536:
                logging.error(f"[TCP] Length is too big: {length}, aborting. It might be because of an older backend script...")
                raise ConnectionResetError()

            msg = (await self.reader.readexactly(length)).decode('utf8')
            if not msg:
                logging.info(f"[TCP] Connection from {self.peername} is closed")
                raise ConnectionResetError()

            return msg
        except asyncio.IncompleteReadError as e:
            raise ConnectionResetError() from e
    
    async def send_msg(self, msg: str):
        request_bytes = msg.encode('utf-8')
        try:
            self.writer.write(struct.pack('>i', len(request_bytes)))
            self.writer.write(request_bytes)
            await self.writer.drain()
        except socket.error as e:
            logging.info(f"[TCP] Connection from {self.peername} is closed while trying to send message to it")
            raise ConnectionError() from e
        
    async def close(self):
        try:
            self.writer.close()
            await self.writer.wait_closed()
            self.reader.feed_eof()
        except Exception:
            logging.exception("Unknown exception while closing the socket, ignoring.")

class WebSocketSocketWraper(SocketWrapper):
    def __init__(self, websocket: WebSocketServerProtocol):
        self.websocket: WebSocketServerProtocol = websocket
        self.peername = str(self.websocket.remote_address)

    async def recv_msg(self) -> str:
        try:
            msg = await self.websocket.recv()
        except websockets.exceptions.ConnectionClosed:
            logging.info(f"[WS] Connection from {self.peername} is closed")

        if isinstance(msg, str):
            return msg

        # Unsupported msg
        await self.close()
        logging.error(f"[WS] Client sent invalid type of msg: {type(msg)}")
        raise ConnectionError("Invalid msg type")

    async def send_msg(self, msg: str):
        try:
            await self.websocket.send(msg)
        except websockets.exceptions.ConnectionClosed as e:
            logging.info(f"[WS] Connection from {self.peername} is closed")    
            raise ConnectionResetError() from e
        
    async def close(self):
        try:
            await self.websocket.close()
        except Exception:
            logging.exception("Unknown exception while closing the socket, ignoring.")

class NetworkHandler(Protocol):
    async def handle_backend(self, sock: SocketWrapper):
        ...
    
    async def handle_frontend(self, sock: SocketWrapper):
        ...

class NetworkHandlerAdapter:
    def __init__(self, handler: NetworkHandler):
        self.handler: NetworkHandler = handler

    async def handle_backend_tcp(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        sock = SocketWrapper.wrap_asyncio(reader, writer)
        logging.info(f"Received backend connection over TCP from {sock.peername}")
        await self.handler.handle_backend(sock)

    async def handle_backend_ws(self, websocket: WebSocketServerProtocol):
        sock = SocketWrapper.wrap_websocket(websocket)
        logging.info(f"Received backend connection over WS from {sock.peername}")
        await self.handler.handle_backend(sock)

    async def handle_frontend_ws(self, websocket: WebSocketServerProtocol):
        sock = SocketWrapper.wrap_websocket(websocket)
        logging.info(f"Received frontend connection over WS from {sock.peername}")
        await self.handler.handle_frontend(sock)