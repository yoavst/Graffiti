import * as net from "net";
import * as vscode from "vscode";
import { SymbolKind } from "vscode";
import { join, basename } from "path";
import { SymbolNode, ScopeFinder } from "./scope";
import { debugChannel } from "./extension";
import { getTokenOrElse } from "./authentication";

let currentServerConnection: net.Socket | null = null;

// TODO assuming single workspace

// Graffiti jsons

class UpdateParams {
  edgeText?: string;
  lineNumber?: number;
  /// full hover information for the node
  hover?: string[];
}

export function createUpdate(
  document: vscode.TextDocument,
  symbol: SymbolNode | null,
  updateParams: UpdateParams,
) {
  const nameAndSymbol =
    symbol == null
      ? null
      : getNameAndLastSymbol(basename(document.fileName), symbol);
  let address = "";
  let name = "";
  if (nameAndSymbol != null) {
    let [name1, lastSymbol] = nameAndSymbol;
    if (updateParams.lineNumber !== undefined) {
      name1 = `${name1}:${updateParams.lineNumber}`;
    }
    const fullName = symbol.getFullName();
    name = name1;

    address =
      vscode.workspace.asRelativePath(document.uri) +
      ":" +
      (updateParams.lineNumber ?? lastSymbol.range.start.line) +
      ":" +
      fullName;
  } else if (updateParams.lineNumber !== undefined) {
    const path = document.uri.path;
    const filename = path.substring(path.lastIndexOf("/") + 1);

    address =
      vscode.workspace.asRelativePath(document.uri) +
      ":" +
      updateParams.lineNumber;
    name = filename + ":" + updateParams.lineNumber;
  } else {
    return null;
  }

  const base = {
    type: "addData",
    node: {
      project: "VSCode: " + getProjectName(),
      address: address,
      label: name,
      computedProperties: [],
    },
  };
  if (updateParams.edgeText) {
    base["node"]["edge"] = { label: updateParams.edgeText };
  }
  if (updateParams.hover) {
    const hover = updateParams.hover.filter((x) => x.trim());
    if (hover) {
      base["node"]["hover"] = hover;
    }
  }
  if (updateParams.lineNumber !== undefined) {
    base["node"]["line"] = updateParams.lineNumber;
  }

  const detail = symbol?.symbolInfo?.detail;
  if (detail) {
    base["node"]["detail"] = detail;
  }

  return base;
}

const SymbolKindsForScope = [
  SymbolKind.Class,
  SymbolKind.Namespace,
  SymbolKind.Module,
  SymbolKind.Package,
  SymbolKind.Struct,
  SymbolKind.Object,
];

const SymbolKindsForName = [
  SymbolKind.Method,
  SymbolKind.Function,
  SymbolKind.Constructor,
];

function getNameAndLastSymbol(
  filename: string,
  symbol: SymbolNode,
): [string, SymbolNode] {
  if (symbol.isRoot) {
    return null;
  }

  // FIXME support scope inside a name (class inside a function for example)
  let n: SymbolNode = symbol;
  let nodes: SymbolNode[] = [];
  do {
    nodes.push(n);
    n = n.parent;
  } while (n && !n.isRoot);

  nodes.reverse();

  let scope: string[] = [];
  let name: string[] = [];
  let firstName: SymbolNode = null;
  for (const node of nodes) {
    if (SymbolKindsForScope.indexOf(node.symbolInfo?.kind) >= 0) {
      scope.push(node.symbolInfo.name);
    } else {
      if (name.length == 0) {
        // First non scope symbol, probably want to add a variable to graffiti
        if (
          node.symbolInfo?.kind == SymbolKind.Field ||
          node.symbolInfo?.kind == SymbolKind.Variable
        ) {
          name.push("_" + node.symbolInfo.name);
          firstName = node;
          break;
        }
      }

      if (SymbolKindsForName.indexOf(node.symbolInfo?.kind) >= 0) {
        if (name.length == 0) {
          firstName = node;
        }
        name.push(node.symbolInfo.name);
      }
    }
  }

  if (name.length == 0) return null;

  // TODO: name[0] is not the best possible option, but we can't solve it for the general case
  let symbolName = (scope.join(".") || filename) + "::\n" + name[0];
  if (vscode.workspace.getConfiguration("graffiti")["removeParentheses"]) {
    symbolName = removeParentheses(symbolName);
  }
  return [symbolName, firstName];
}

function removeParentheses(str: string) {
  let output = "";
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    if (str[i] === "(") {
      depth++;
    } else if (str[i] === ")") {
      depth--;
    } else if (depth === 0) {
      output += str[i];
    }
  }

  return output.trim().replace(/ {2,}/g, " ");
}

// Sockets
export async function sendUpdate(data: any) {
  const socket = currentServerConnection;
  // Connect to the server
  if (socket != null) {
    const jsonData = JSON.stringify(data);
    var jsonDataBuff = Buffer.from(jsonData, "utf8");
    // write length
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeInt32BE(jsonDataBuff.length, 0);
    socket.write(lengthBuffer);
    // write data
    socket.write(jsonDataBuff);
  } else {
    await vscode.window.showInformationMessage("Graffiti: Not connected");
  }
}

// taken from https://stackoverflow.com/questions/38039362/nodejs-socket-programming-send-data-length
function receive(socket, data, onMsg) {
  //Create a chunk prop if it does not exist
  if (!socket.chunk) {
    socket.chunk = {
      messageSize: 0,
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
    if (
      socket.chunk.messageSize != 0 &&
      socket.chunk.bufferStack.length >= socket.chunk.messageSize + 4
    ) {
      var buffer = socket.chunk.bufferStack.slice(
        4,
        socket.chunk.messageSize + 4,
      );
      socket.chunk.messageSize = 0;
      socket.chunk.bufferStack = socket.chunk.bufferStack.slice(
        buffer.length + 4,
      );
      onMsg(socket, buffer);
      //if the stack contains more data after read the entire message, maybe you got a new message, so it will verify the next 4 bytes and so on...
      reCheck = socket.chunk.bufferStack.length > 0;
    }
  } while (reCheck);
}

export function connectServer(host: string, port: number) {
  disconnectServer();

  currentServerConnection = new net.Socket();
  currentServerConnection.connect(port, host, () => {
    vscode.window.showInformationMessage(
      "Connected to graffiti! (might require authentication if enabled on server)",
    );
    debugChannel.appendLine(`Connected to graffiti at ${host}:${port}`);
  });

  currentServerConnection.on("data", (rawData) => {
    receive(currentServerConnection, rawData, (_, msg) => {
      const data = JSON.parse(msg.toString());
      if ("type" in data && data["type"] == "auth_req_v1") {
        getTokenOrElse(() => {
          return vscode.window.showInputBox({
            prompt: "Enter the UUID token from graffiti website",
            value: "",
          });
        }).then((token) => {
          if (token != null) {
            sendUpdate({
              type: "auth_resp_v1",
              token,
            });
          } else {
            disconnectServer();
          }
        });
        return;
      }
      if ("project" in data) {
        if (!data["project"].startsWith("VSCode:")) {
          return;
        }
      }
      let [path, line, ...rest] = data["address"].trim().split(":");
      line = parseInt(line);

      if (
        rest.length == 0 ||
        !vscode.workspace.getConfiguration("graffiti")["searchForSymbol"]
      ) {
        // Old version
        jumpToPath(path, line);
      } else {
        let symbol = rest.join(":");
        jumpToSymbol(path, symbol).then((success) => {
          if (!success) {
            jumpToPath(path, line);
          }
        });
      }
    });
  });

  currentServerConnection.on("close", (_) => {
    debugChannel.appendLine("Connection closed");
    currentServerConnection = null;
  });
}

export function disconnectServer() {
  if (currentServerConnection != null) {
    currentServerConnection.end();
    currentServerConnection = null;
  }
}

// Vscode utils
function getProjectName(): string {
  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  //const currentProjectPath = workspaceFolder.uri.fsPath
  return workspaceFolder.name;
}

function jumpToPath(path: string, line: number) {
  vscode.workspace.openTextDocument(pathToUri(path)).then((document) => {
    vscode.window.showTextDocument(document, {
      selection: new vscode.Range(line, 0, line, 0),
    });
  });
}

async function jumpToSymbol(path: string, symbol: string): Promise<boolean> {
  const symbols = await ScopeFinder.getScopeSymbolsFor(pathToUri(path));
  if (symbols) {
    for (const rootSymbol of symbols) {
      const target = iterSymbolsDFS(rootSymbol, symbol);
      if (target) {
        jumpToPath(path, target.range.start.line);
        return true;
      }
    }
  }
  return false;
}

function iterSymbolsDFS(
  currentSymbol: vscode.DocumentSymbol | undefined,
  targetSymbol: string,
  baseIndex: number = 0,
): vscode.DocumentSymbol | undefined {
  if (!currentSymbol) return undefined;

  const name = currentSymbol.name;
  if (targetSymbol.startsWith(name, baseIndex)) {
    if (name.length + baseIndex == targetSymbol.length) {
      // we mwatch the whole text
      return currentSymbol;
    }

    // +1 for the dot
    const newBaseIndex = baseIndex + name.length + 1;
    for (const child of currentSymbol.children) {
      const res = iterSymbolsDFS(child, targetSymbol, newBaseIndex);
      if (res) return res;
    }
  }

  return undefined;
}

function pathToUri(path: string): vscode.Uri {
  return vscode.Uri.file(
    join(vscode.workspace.workspaceFolders[0].uri.fsPath, path),
  );
}

export async function updateSymbolsForGraffiti(graffitiObj): Promise<boolean> {
  debugChannel.appendLine("updateSymbolsForGraffiti()");

  const treeCache = new Map<string, SymbolNode>();
  const missingSymbolsFiles = new Map<String, SymbolNode>();
  try {
    for (const node of graffitiObj[1]) {
      if (
        !node.extra.hasOwnProperty("project") ||
        !node.extra.project.startsWith("VSCode:") ||
        node.extra.hasOwnProperty("line")
      ) {
        // Not a vscode node or it is a line node, skip
        continue;
      }

      const label = (node.label ?? "<unknown>").replace("\n", "");
      const oldAddress = node.extra.address;
      let [path, line, ...rest] = oldAddress.trim().split(":");
      line = parseInt(line);

      if (rest.length != 0) {
        // We have a symbol attached to this node, skip
        continue;
      }
      debugChannel.appendLine(
        `handling file: ${path} line: ${line} symbol: ${label}`,
      );

      // Get tree from cache or calculate it
      let tree: SymbolNode = null;
      if (treeCache.has(path)) {
        tree = treeCache.get(path);
      } else {
        let symbols = null;
        try {
          symbols = await ScopeFinder.getScopeSymbolsFor(pathToUri(path));
        } catch (e) {
          debugChannel.appendLine(`\tError handling: ${e.message}`);
          debugChannel.appendLine(e.stack);
          continue;
        }
        if (symbols == null) {
          debugChannel.appendLine(`\tno symbols in path, skipping`);
          continue;
        }
        tree = SymbolNode.createSymbolTree(symbols);
        treeCache.set(path, tree);
      }

      // Check for matching symbol
      const matchingNodes = getNodeStartsSameLine(line, tree);
      if (matchingNodes.length == 0) {
        debugChannel.appendLine(`\tNo matching node!`);
        if (!missingSymbolsFiles.has(path)) {
          missingSymbolsFiles.set(path, tree);
        }
        continue;
      } else if (matchingNodes.length > 1) {
        debugChannel.appendLine(`\tMultiple symbols for ${label}`);
        for (const matchingNode of matchingNodes) {
          debugChannel.appendLine(`\t\t${matchingNode.getFullName()}`);
        }
        // TODO: be able to choose
        continue;
      }

      const selectedNewNode = matchingNodes[0];
      const newAddress = oldAddress + ":" + selectedNewNode.getFullName();

      node.extra.address = newAddress;
    }
  } catch (e) {
    await vscode.window.showErrorMessage(
      `failed to process graffiti file: ${e.message}`,
    );
    debugChannel.appendLine(e.stack);
    return false;
  }
  // Print files with missing nodes to help debug
  for (const [path, tree] of missingSymbolsFiles.entries()) {
    debugChannel.appendLine(`Debugging file: ${path}`);
    for (const node of tree.iterNodes()) {
      debugChannel.appendLine(
        `\t${JSON.stringify(node.range.start)} -> ${node.getFullName()}`,
      );
    }
    debugChannel.appendLine("");
  }

  debugChannel.appendLine("Completed updateSymbolsForGraffiti()");
  return true;
}

function getNodeStartsSameLine(line: number, root: SymbolNode): SymbolNode[] {
  const nodes = [];
  // JS doesn't have filter on iterable, because this language...
  for (const node of root.iterNodes()) {
    if (node.range.start.line == line) {
      nodes.push(node);
    }
  }

  return nodes;
}
