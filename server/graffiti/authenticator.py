import asyncio
import json
import logging
from typing import Optional
from uuid import UUID
from .dispatcher import Dispatcher
from .network_handler import NetworkHandler, SocketWrapper

SINGLE_USER_TOKEN = "00000000-0000-0000-0000-000000000000"
AUTHENTICATION_TIMEOUT = float(300) # 5 minutes


class Authenticator(NetworkHandler):
    def __init__(self, dispatcher: Dispatcher, is_multi_user_mode: bool):
        self.dispatcher = dispatcher
        self.is_multi_user_mode = is_multi_user_mode

    async def handle_backend(self, sock: SocketWrapper):
        token = await self._handle_auth(sock)
        if token is not None:
            await self.dispatcher.handle_backend(token, sock)

    
    async def handle_frontend(self, sock: SocketWrapper):
        token = await self._handle_auth(sock)
        if token is not None:
            await self.dispatcher.handle_frontend(token, sock)

    async def _handle_auth(self, sock: SocketWrapper) -> Optional[str]:
        token: str
        if self.is_multi_user_mode:
            try:
                await self._send_auth_request(sock)
                token = await self._recv_auth_response(sock)
                if not self._validate_token(token):
                    logging.warning(f"{sock.peername} sent invalid token: ${token}")
                    raise ConnectionError("invalid token")
                
                logging.info(f"Successfully authenticated {sock.peername} with token: {token}")
            except ConnectionError:
                await sock.close()
                logging.info(f"{sock.peername} failed the authentication step.")
                return
            except TimeoutError:
                await sock.close()
                logging.info(f"{sock.peername} timeout during the authentication step.")
                return
        else:
            token = SINGLE_USER_TOKEN
        
        return token

    async def _send_auth_request(self, sock: SocketWrapper):
        auth_req = {
            'type': 'auth_req_v1'
        }
        logging.info(f"Asking {sock.peername} to authenticate")

        await sock.send_msg(json.dumps(auth_req))

    async def _recv_auth_response(self, sock: SocketWrapper) -> str:
        response = await asyncio.wait_for(sock.recv_msg(), timeout=AUTHENTICATION_TIMEOUT)
        try:
            response_json = json.loads(response)
            if 'type' not in response_json or response_json['type'] != 'auth_resp_v1':
                logging.warning(f"Received invalid response for auth request from {sock.peername}, probably old version")
                raise ConnectionError("Invalid response for auth request")
            elif 'token' not in response_json or not isinstance(response_json['token'], str):
                logging.warning(f"Received invalid response for auth request from {sock.peername}, token is not a string")
                raise ConnectionError("Invalid response for auth request")
            
            return response_json['token']
        except json.JSONDecodeError as e:
            logging.exception(f"Received invalid json as authentication response from {sock.peername}")
            raise ConnectionError from e
    
    def _validate_token(self, token: str) -> bool:
        try:
            UUID(token, version=4)
            return True
        except ValueError:
            return False