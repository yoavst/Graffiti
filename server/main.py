import asyncio
import socket

import websockets

list_websockets = []
list_ide_pull = []

WEBSOCKET_PORT = 8765
PUSH_PORT = 8764
PULL_PORT = 8763


async def handle_ide_push(reader, writer):
    print("[I] Got IDE connection!")

    request = (await reader.read(4096)).decode('utf8')
    writer.close()

    for i in range(len(list_websockets) - 1, -1, -1):
        websocket = list_websockets[i]
        try:
            await websocket.send(request)

        except websockets.exceptions.ConnectionClosedOK:
            print("[I] removing WEB!")
            del list_websockets[i]


async def handle_ide_pull(_, writer):
    print("[I] got IDE pulling connection!")
    list_ide_pull.append(writer)
    while True:
        await asyncio.Future()



async def handle_web(websocket):
    magic = await websocket.recv()
    print("[I] got WEB connection!")
    list_websockets.append(websocket)
    try:
        while True:
            msg = await websocket.recv()
            if msg != 'MAGIC':
                for i in range(len(list_ide_pull) - 1, -1, -1):
                    ide_writer = list_ide_pull[i]
                    try:
                        ide_writer.write((msg + "\n").encode('utf-8'))
                        await ide_writer.drain()

                    except socket.error:
                        print("[I] removing IDE PULL!")
                        del list_ide_pull[i]
    except (websockets.exceptions.ConnectionClosedOK, websockets.exceptions.ConnectionClosedError):
        print("[I] removing WEB!")
        try:
            list_websockets.remove(websocket)
        except ValueError:
            pass


async def main():
    async with websockets.serve(handle_web, "localhost", WEBSOCKET_PORT):
        async with await asyncio.start_server(handle_ide_push, 'localhost', PUSH_PORT):
            async with await asyncio.start_server(handle_ide_pull, 'localhost', PULL_PORT):
                await asyncio.Future()  # run forever


asyncio.run(main())
