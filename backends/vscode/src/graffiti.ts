import * as net from 'net';
import * as vscode from 'vscode';
import { Memento } from "vscode";
import { SymbolKind } from 'vscode';
import { join, basename } from 'path';
import { SymbolNode, ScopeFinder } from './scope';
import { LocalStorageService } from './storage';

let currentServerConnection: net.Socket | null = null

// TODO assuming single workspace

// Graffiti jsons
export function createUpdate(document: vscode.TextDocument, symbol: SymbolNode, edgeText: string = null) {
    const name = getName(basename(document.fileName), symbol)
    if (name == null) return null
    const base = {
        "type": "addData", "node": {
            "project": "VSCode: " + getProjectName(),
            "address": vscode.workspace.asRelativePath(document.uri) + ":" + symbol.range.start.line,
            "label": name,
            "computedProperties": []
        }
    }
    if (edgeText) {
        base['edge'] = { 'label': edgeText }
    }

    base['isNodeTarget'] = getIsNodeTarget()

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


function getName(filename: string, symbol: SymbolNode): string {
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
    for (const node of nodes) {
        if (SymbolKindsForScope.indexOf(node.symbolInfo?.kind) >= 0) {
            scope.push(node.symbolInfo.name)
        } else {
            if (name.length == 0) {
                // First non scope symbol, probably want to add a variable to graffiti
                if (node.symbolInfo?.kind == SymbolKind.Field || node.symbolInfo?.kind == SymbolKind.Variable) {
                    name.push("_" + node.symbolInfo.name)
                    break
                }
            }

            if (SymbolKindsForName.indexOf(node.symbolInfo?.kind) >= 0) {
                name.push(node.symbolInfo.name)
            }
        }
    }

    if (name.length == 0) return null;

    return (scope.join('.') || filename) + "::\n" + name.join('.');

}


// Sockets
export function sendUpdate(data: any) {
    const client = new net.Socket();

    // Connect to the server
    client.connect(8764, 'localhost', () => {
        console.log('Connected to server')
        client.write(JSON.stringify(data))
        client.end()
    });
}

export function connectServer(host: string, port: number) {
    disconnectServer()

    currentServerConnection = new net.Socket();
    currentServerConnection.connect(port, host, () => {
        console.log('Connected to pull socket')
    });

    currentServerConnection.on('data', (data) => {
        let [path, line] = data.toString().trim().split(":")
        jumpTo(path, parseInt(line))
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

function getIsNodeTarget(): boolean {
    const result = LocalStorageService.instance.getValue<boolean>('__yoav_is_node_target')
    if (result === null) return true
    return !!result
}

export function switchIsNodeTarget() {
    const newValue = !getIsNodeTarget()
    LocalStorageService.instance.setValue<boolean>('__yoav_is_node_target', newValue);
}