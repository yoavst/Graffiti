import * as net from 'net';
import * as vscode from 'vscode';
import { SymbolKind } from 'vscode';
import { join, basename } from 'path';
import { SymbolNode, ScopeFinder } from './scope';
import { LocalStorageService } from './storage';

let currentServerConnection: net.Socket | null = null

// TODO assuming single workspace

// Graffiti jsons
export function createUpdate(document: vscode.TextDocument, symbol: SymbolNode, edgeText: string = null) {
    const nameAndSymbol = getNameAndLastSymbol(basename(document.fileName), symbol)
    if (nameAndSymbol == null) return null

    const [name, lastSymbol] = nameAndSymbol
    const base = {
        "type": "addData", "node": {
            "project": "VSCode: " + getProjectName(),
            "address": vscode.workspace.asRelativePath(document.uri) + ":" + lastSymbol.range.start.line,
            "label": name,
            "computedProperties": []
        }
    }
    if (edgeText) {
        base['edge'] = { 'label': edgeText }
    }

    return base
}

const SymbolKindsForScope = [
    SymbolKind.Class,
    SymbolKind.Namespace,
    SymbolKind.Module,
    SymbolKind.Package
]

const SymbolKindsForName = [
    SymbolKind.Method,
    SymbolKind.Function,
    SymbolKind.Constructor,
]


function getNameAndLastSymbol(filename: string, symbol: SymbolNode): [string, SymbolNode] {
    if (symbol.isRoot) {
        return null
    }

    // FIXME support scope inside a name (class inside a function for example)
    let n: SymbolNode = symbol
    let nodes: SymbolNode[] = []
    do {
        nodes.push(n)
        n = n.parent
    } while (n && !n.isRoot)

    nodes.reverse()

    let scope: string[] = []
    let name: string[] = []
    let lastName: SymbolNode = null
    for (const node of nodes) {
        if (SymbolKindsForScope.indexOf(node.symbolInfo?.kind) >= 0) {
            scope.push(node.symbolInfo.name)
        } else {
            if (name.length == 0) {
                // First non scope symbol, probably want to add a variable to graffiti
                if (node.symbolInfo?.kind == SymbolKind.Field || node.symbolInfo?.kind == SymbolKind.Variable) {
                    name.push("_" + node.symbolInfo.name)
                    lastName = node
                    break
                }
            }

            if (SymbolKindsForName.indexOf(node.symbolInfo?.kind) >= 0) {
                name.push(node.symbolInfo.name)
                lastName = node
            }
        }
    }

    if (name.length == 0) return null;

    // TODO: name[0] is not the best possible option, but we can't solve it for the general case
    return [(scope.join('.') || filename) + "::\n" + name[0], lastName]
}


// Sockets
export async function sendUpdate(data: any) {
    const socket = currentServerConnection
    // Connect to the server
    if (socket != null) {
        const jsonData = JSON.stringify(data)
        // write length
        const lengthBuffer = Buffer.alloc(4)
        lengthBuffer.writeInt32BE(jsonData.length, 0)
        socket.write(lengthBuffer)
        // write data
        socket.write(jsonData)
    } else {
        await vscode.window.showInformationMessage("Graffiti: Not connected")
    }
}

// taken from https://stackoverflow.com/questions/38039362/nodejs-socket-programming-send-data-length
function receive(socket, data, onMsg){
    //Create a chunk prop if it does not exist
    if(!socket.chunk){
        socket.chunk = {
            messageSize : 0,
            buffer: Buffer.from([]),
            bufferStack: Buffer.from([]),
        };
    }
    //store the incoming data
    socket.chunk.bufferStack = Buffer.concat([socket.chunk.bufferStack, data]);
    //this is to check if you have a second message incoming in the tail of the first
    var reCheck = false;
    do {
        reCheck = false;
        //if message size == 0 you got a new message so read the message size (first 4 bytes)
        if (socket.chunk.messageSize == 0 && socket.chunk.bufferStack.length >= 4) {
            socket.chunk.messageSize = socket.chunk.bufferStack.readInt32BE(0);
        }

        //After read the message size (!= 0) and the bufferstack is completed and/or the incoming data contains more data (the next message)
        if (socket.chunk.messageSize != 0 && socket.chunk.bufferStack.length >= socket.chunk.messageSize + 4) {
            var buffer = socket.chunk.bufferStack.slice(4, socket.chunk.messageSize + 4);
            socket.chunk.messageSize = 0;
            socket.chunk.bufferStack = socket.chunk.bufferStack.slice(buffer.length + 4);
            onMsg(socket, buffer);
            //if the stack contains more data after read the entire message, maybe you got a new message, so it will verify the next 4 bytes and so on...
            reCheck = socket.chunk.bufferStack.length > 0;
        }
    } while (reCheck);
}

export function connectServer(host: string, port: number) {
    disconnectServer()

    currentServerConnection = new net.Socket();
    currentServerConnection.connect(port, host, () => {
        console.log('Connected to graffiti!')
    });

    currentServerConnection.on('data', (rawData) => {
        receive(currentServerConnection, rawData, (_, msg) => {
            const data = JSON.parse(msg.toString())
            if ('project' in data) {
                if (!data['project'].startsWith('VSCode:')) {
                    return
                }
            }
            let [path, line] = data['address'].trim().split(":")
            jumpTo(path, parseInt(line))
        })
    })

    currentServerConnection.on('close', (_) => {
        console.log("Connection closed")
        currentServerConnection = null
    })
}

export function disconnectServer() {
    if (currentServerConnection != null) {
        currentServerConnection.end()
        currentServerConnection = null
    }
}

// Vscode utils
function getProjectName(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders[0]
    //const currentProjectPath = workspaceFolder.uri.fsPath
    return workspaceFolder.name
}

function jumpTo(path: string, line: number) {
    const uri = vscode.Uri.file(join(vscode.workspace.workspaceFolders[0].uri.fsPath, path));

    vscode.workspace.openTextDocument(uri).then((document) => {
        vscode.window.showTextDocument(document, { selection: new vscode.Range(line, 0, line, 0) });
    });
}