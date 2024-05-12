
from dataclasses import dataclass
import logging
from typing import List
from network_handler import SocketWrapper

@dataclass
class RouteState:
    token: str
    frontends: List[SocketWrapper]
    backends: List[SocketWrapper]

    def add_frontend(self, sock: SocketWrapper):
        self.frontends.append(sock)
    
    def del_frontend(self, sock: SocketWrapper):
        try:
            self.frontends.remove(sock)
        except ValueError:
            logging.warning("Removing a frontend from RouterState, but the frontend was already removed")

    def add_backend(self, sock: SocketWrapper):
        self.backends.append(sock)
    
    def del_backend(self, sock: SocketWrapper):
        try:
            self.backends.remove(sock)
        except ValueError:
            logging.exception("Removing a backend from RouterState, but the backend was already removed")

    @staticmethod
    def from_token(token: str) -> "RouteState":
        return RouteState(token, [], [])

    def __str__(self) -> str:
        return f"Route(token: {self.token}) {{ frontends: {len(self.frontends)}, backends: {len(self.backends)} }}"

    def can_dispose(self) -> bool:
        return not self.frontends and not self.backends

class Dispatcher:
    def __init__(self, should_dump_messages):
        self.routes: dict[str, RouteState] = dict()
        self.should_dump_messages: bool = should_dump_messages

    async def handle_backend(self, token: str, sock: SocketWrapper):
        route = self._route_for_token(token)
        route.add_backend(sock)

        while True:
            try:
                msg = await sock.recv_msg()
                logging.info(f"Received backend message from {sock.peername} on route: {token}")
                if self.should_dump_messages:
                    logging.info(f"Backend Message: {msg}")
                
                await self.send_to_all(msg, route.frontends)
            except ConnectionError:
                logging.info(f"Removing disconnected {sock.peername} from backends")
                route.del_backend(sock)
                self._gc_route(route)
                break
            except Exception:
                logging.info("Got exception during handling a backend. Closing the connection.")
                route.del_backend(sock)
                self._gc_route(route)
                break

    async def handle_frontend(self, token: str, sock: SocketWrapper):
        route = self._route_for_token(token)
        if len(route.frontends) > 0:
            logging.warning("Multiple frontends are not currently supported. Disconnect all the other frontends.")
            for frontend in route.frontends:
                await frontend.close()
            route.frontends = []
        
        route.add_frontend(sock)

        while True:
            try:
                msg = await sock.recv_msg()
                logging.info(f"Received frontend message from {sock.peername} on route: {token}")
                if self.should_dump_messages:
                    logging.info(f"Frontend Message: {msg}")
                
                await self.send_to_all(msg, route.backends)
            except ConnectionError:
                logging.info(f"Removing disconnected {sock.peername} from frontends")
                route.del_frontend(sock)
                self._gc_route(route)
                break
            except Exception:
                logging.info("Got exception during handling a frontend. Closing the connection.")
                route.del_frontend(sock)
                self._gc_route(route)
                break

    async def send_to_all(self, msg: str, sockets: List[SocketWrapper]):        
        for frontend in sockets:
            try:
                await frontend.send_msg(msg)
            except ConnectionError:
                logging.exception("Exception while sending message, ignoring")
            

    def _route_for_token(self, token: str) -> RouteState:
        if token in self.routes:
            return self.routes[token]
        
        route = RouteState.from_token(token)
        self.routes[token] = route
        return route
    
    def _gc_route(self, route: RouteState):
        if route.can_dispose():
            logging.info(f"GCing route {route.token}")
            del self.routes[route.token]

    def __repr__(self) -> str:
        return '\n'.join('\t' + str(x) for x in self.routes.values())
