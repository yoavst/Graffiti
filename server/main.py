import asyncio
import socket

import websockets

list_websockets = []
list_ide_pull = []
list_web_pull = []

WEBSOCKET_PULL_PORT = 8767
WEBSOCKET_PUSH_PORT = 8766
WEBSOCKET_PORT = 8765
PUSH_PORT = 8764
PULL_PORT = 8763


# Push
async def handle_ide_push(reader, writer):
    print("[I] Got IDE connection!")

    request = (await reader.read(4096)).decode('utf8')
    await writer.close()

    for i in range(len(list_websockets) - 1, -1, -1):
        websocket = list_websockets[i]
        try:
            await websocket.send(request)

        except websockets.exceptions.ConnectionClosedOK:
            print("[I] removing WEB!")
            del list_websockets[i]

async def handle_web_push(push_websocket):
    # Support for chrome extension, which does not support TCP Sockets
    print("[I] Got WEB IDE connection!")

    request = await push_websocket.recv()
    push_websocket.close()

    for i in range(len(list_websockets) - 1, -1, -1):
        websocket = list_websockets[i]
        try:
            await websocket.send(request)

        except websockets.exceptions.ConnectionClosedOK:
            print("[I] removing WEB!")
            del list_websockets[i]


# Pull
async def handle_ide_pull(_, writer):
    print("[I] got IDE pulling connection!")
    list_ide_pull.append(writer)
    while True:
        await asyncio.Future()

async def handle_web_pull(pull_websocket):
    print("[I] got WEB IDE pulling connection!")
    list_web_pull.append(pull_websocket)
    while True:
        await asyncio.Future()

async def handle_frontend(websocket):
    magic = await websocket.recv()
    print("[I] got WEB connection!")
    list_websockets.append(websocket)
    try:
        while True:
            msg = await websocket.recv()
            if msg != 'MAGIC':
                print ("[I] Got Web push")
                for i in range(len(list_ide_pull) - 1, -1, -1):
                    ide_writer = list_ide_pull[i]
                    try:
                        ide_writer.write((msg + "\n").encode('utf-8'))
                        await ide_writer.drain()

                    except socket.error:
                        print("[I] removing IDE PULL!")
                        del list_ide_pull[i]

                for i in range(len(list_web_pull) - 1, -1, -1):
                    pull_websocket = list_web_pull[i]
                    try:
                        await pull_websocket.send((msg + "\n"))

                    except (websockets.exceptions.ConnectionClosedOK, websockets.exceptions.ConnectionClosedError):
                        print("[I] removing WEB PULL!")
                        del list_web_pull[i]

    except (websockets.exceptions.ConnectionClosedOK, websockets.exceptions.ConnectionClosedError):
        print("[I] removing WEB!")
        try:
            list_websockets.remove(websocket)
        except ValueError:
            pass


async def main():
    async with websockets.serve(handle_frontend, "0.0.0.0", WEBSOCKET_PORT):
        async with await asyncio.start_server(handle_ide_push, '0.0.0.0', PUSH_PORT):
            async with await asyncio.start_server(handle_ide_pull, '0.0.0.0', PULL_PORT):
                async with websockets.serve(handle_web_push, "0.0.0.0", WEBSOCKET_PUSH_PORT):
                    async with websockets.serve(handle_web_pull, "0.0.0.0", WEBSOCKET_PULL_PORT):
                        await asyncio.Future()  # run forever


asyncio.run(main())
