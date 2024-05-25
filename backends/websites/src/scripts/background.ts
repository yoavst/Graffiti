import {
    GetSymbolRequestMessage,
    Prefs,
    SymbolResponse,
    getPrefs,
    isValidUUIDv4,
    onExtMessage,
    sendExtMessage,
    stripUrl,
} from "./shared";

let graffitiWebSocket: WebSocket | null;
let cachedPrefs: Prefs;

type GraffitiCommand = "add_to_graffiti" | "add_to_graffiti_with_custom_edge" | "add_line_to_graffiti";

function updatePrefs() {
    getPrefs((prefs) => {
        cachedPrefs = prefs;
    });
}

function main() {
    chrome.runtime.onStartup.addListener(() => {
        console.log(`onStartup()`);
    });

    // Cache prefs
    getPrefs((prefs) => {
        cachedPrefs = prefs;
    });
    chrome.storage.onChanged.addListener((_1, _2) => updatePrefs());

    // Add context menu
    chrome.runtime.onInstalled.addListener(() => {
        const contexts: chrome.contextMenus.ContextType[] = ["page", "link", "selection"];
        chrome.contextMenus.create({
            id: "add_to_graffiti",
            title: "Add to Graph",
            contexts,
        });
        chrome.contextMenus.create({
            id: "add_to_graffiti_with_custom_edge",
            title: "Add to Graph with edge comment",
            contexts,
        });

        chrome.contextMenus.create({
            id: "add_line_to_graffiti",
            title: "Add current line to Graph",
            contexts,
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (!tab) return;
            onCommand(info.menuItemId as GraffitiCommand, tab, true);
        });
    });

    // Handle connection commands
    onExtMessage((extMsg) => {
        console.log("received:", extMsg);
        if (extMsg.action == "connectPull") {
            connectPullWebSocket(extMsg.addr);
        } else if (extMsg.action == "getConnectionPullRequest") {
            if (graffitiWebSocket != null) {
                sendExtMessage({
                    action: "getConnectionPullResult",
                    status: graffitiWebSocket.readyState !== WebSocket.CLOSED,
                });
            }
        }
    });

    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener(function (command) {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
            tabs.forEach((tab) => onCommand(command as GraffitiCommand, tab, false));
        });
    });
}

function closeWebSocket() {
    if (graffitiWebSocket != null) {
        if (graffitiWebSocket.readyState !== WebSocket.CLOSED) graffitiWebSocket.close();
        graffitiWebSocket = null;
    }
}

function connectPullWebSocket(addr: string) {
    closeWebSocket();
    const tmpSocket = new WebSocket(addr);
    graffitiWebSocket = tmpSocket;

    graffitiWebSocket.onopen = function (event) {
        sendExtMessage({ action: "getConnectionPullResult", status: true });
    };

    graffitiWebSocket.onerror = function (event) {
        sendExtMessage({ action: "getConnectionPullResult", status: false });

        if (graffitiWebSocket == tmpSocket) {
            graffitiWebSocket = null;
        }
    };

    graffitiWebSocket.onclose = function (event) {
        sendExtMessage({ action: "getConnectionPullResult", status: false });

        if (graffitiWebSocket == tmpSocket) {
            graffitiWebSocket = null;
        }
    };
    graffitiWebSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if ("type" in data && data["type"] == "auth_req_v1") {
            getPrefs((prefs) => {
                const token = prefs.token.trim();
                if (token.length == 0) {
                    chrome.notifications.create("noAuthToken", {
                        type: "basic",
                        iconUrl: "images/icon.png",
                        title: "Graffiti",
                        message:
                            "Not authenticated. Copy the token from graffiti to the input on the bottom of the connection dialog.",
                    });
                    closeWebSocket();
                } else if (!isValidUUIDv4(token)) {
                    chrome.notifications.create("invalidAuthToken", {
                        type: "basic",
                        iconUrl: "images/icon.png",
                        title: "Graffiti",
                        message:
                            "The token is not a valid one. Copy the token from graffiti to the input on the bottom of the connection dialog.",
                    });
                    closeWebSocket();
                } else {
                    graffitiWebSocket?.send(
                        JSON.stringify({
                            type: "auth_resp_v1",
                            token: token,
                        }),
                    );
                }
            });
            return;
        }
        if ("project" in data) {
            if (!data["project"].startsWith("OpenGrok:") && !data["project"].startsWith("SourceGraph:")) {
                return;
            }
        }
        const url = data.address;

        const tabBehavior = cachedPrefs.tabBehavior;
        if (tabBehavior == "alwaysNew") {
            createNewTab(url);
        } else if (tabBehavior == "sameIfExists") {
            changeSameTabIfExists(url);
        }
    };
}

function createNewTab(url: string) {
    chrome.windows.getAll({ populate: true }, function (windows) {
        const otherWindows = windows.filter(
            (window) => (window.tabs || []).filter((tab) => tab.title == "Graffiti").length == 0,
        );
        if (otherWindows.length) {
            // try focused one
            const otherWindowsFocused = otherWindows.filter((window) => window.focused);
            if (otherWindowsFocused.length) {
                chrome.tabs.create({
                    url: url,
                    windowId: otherWindowsFocused[0].id,
                });
            } else {
                // Take the first
                chrome.tabs.create({ url: url, windowId: otherWindows[0].id });
            }
        } else {
            // Create new window
            chrome.windows.create({ url: url });
        }
    });
}

function changeSameTabIfExists(url: string) {
    const urlWithoutHash = stripUrl(url);

    chrome.tabs.query({}, function (tabs) {
        const matchingTabs = tabs.filter(
            (tab) => (tab.url || "").indexOf(urlWithoutHash) >= 0 && tab.windowId != chrome.windows.WINDOW_ID_CURRENT,
        );
        if (matchingTabs.length == 0) {
            createNewTab(url);
        } else {
            chrome.tabs.update(matchingTabs[matchingTabs.length - 1].id!, {
                url: url,
                active: true,
            });
        }
    });
}

function onSymbol(symbolResponse: SymbolResponse) {
    console.log(symbolResponse);

    if (!symbolResponse.isCorrectWebsite) return;

    const symbolInfo = symbolResponse.info;
    if (symbolInfo == null) {
        chrome.notifications.create("noSymbol", {
            type: "basic",
            iconUrl: "images/icon.png",
            title: "Graffiti",
            message: "Could not find symbol in this line",
        });
        return;
    }

    const websocket = graffitiWebSocket;
    if (websocket == null) {
        chrome.notifications.create("notConnected", {
            type: "basic",
            iconUrl: "images/icon.png",
            title: "Graffiti",
            message: "Not connected to server",
        });
        return;
    }

    const data: any = {
        type: "addData",
        node: {
            project: symbolInfo.sourceType + ": " + symbolInfo.site,
            address: symbolInfo.address,
            label: symbolInfo.sig,
            computedProperties: [],
        },
    };
    if (symbolInfo.edgeLabel) {
        data.edge = { label: symbolInfo.edgeLabel };
    }
    websocket.send(JSON.stringify(data));
}

function onLineSymbol(symbolResponse: SymbolResponse) {
    console.log(symbolResponse);

    if (!symbolResponse.isCorrectWebsite) return;

    const symbolInfo = symbolResponse.info;

    if (symbolInfo == null) {
        chrome.notifications.create("noLine", {
            type: "basic",
            iconUrl: "images/icon.png",
            title: "Graffiti",
            message: "Could not find a line",
        });
        return;
    }

    const websocket = graffitiWebSocket;
    if (websocket == null) {
        chrome.notifications.create("notConnected", {
            type: "basic",
            iconUrl: "images/icon.png",
            title: "Graffiti",
            message: "Not connected to server",
        });
        return;
    }

    const data: any = {
        type: "addData",
        node: {
            project: symbolInfo.sourceType + ": " + symbolInfo.site,
            address: symbolInfo.address,
            label: symbolInfo.sig,
            line: symbolInfo.line,
            computedProperties: [],
        },
    };
    if (symbolInfo.edgeLabel) {
        data.edge = { label: symbolInfo.edgeLabel };
    }
    websocket.send(JSON.stringify(data));
}

function onCommand(command: GraffitiCommand, tab: chrome.tabs.Tab, isContextMenu: boolean) {
    const isLine = command == "add_line_to_graffiti";
    const request: GetSymbolRequestMessage = {
        action: "getSymbolRequest",
        source: isContextMenu ? "contextMenu" : "command",
        isLine,
        askForEdgeText: command == "add_to_graffiti_with_custom_edge",
    };
    console.log(tab);
    chrome.tabs.sendMessage(tab.id!, request, isLine ? onLineSymbol : onSymbol);
}

main();
