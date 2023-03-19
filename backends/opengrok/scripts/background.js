let pullWebSocket = null
let cachedSettings = {}

function main() {
    // Cache settings
    chrome.storage.local.get(["tab_behavior", "src_dest"], function (result) {
        cachedSettings = result
    })

    chrome.storage.onChanged.addListener(function (changes, _) {
        for (let [key, { newValue }] of Object.entries(changes)) {
            cachedSettings[key] = newValue
        }
    })

    // Add context menu
    chrome.contextMenus.create({
        id: 'add_to_graffiti',
        title: 'Add to Graph',
        contexts: ['page']
    })
    chrome.contextMenus.create({
        id: 'add_to_graffiti_with_custom_edge',
        title: 'Add to Graph with edge comment',
        contexts: ['page']
    })
    chrome.contextMenus.onClicked.addListener(contextClick)

    // Handle connection commands
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.action == 'getConnectPull') {
            sendResponse({})

            if (pullWebSocket == null) chrome.runtime.sendMessage({ action: "getConnectPullResult" })
            else if (pullWebSocket.readyState === WebSocket.CLOSED) chrome.runtime.sendMessage({ action: "getConnectPullResult", status: false })
            else chrome.runtime.sendMessage({ action: "getConnectPullResult", status: true })
        } else if (msg.action == 'connectPull') {
            sendResponse({})
            connectPullWebSocket(msg.addr)
        }
    })

    // Handle keyboard commands
    chrome.commands.onCommand.addListener(function (command) {
        chrome.tabs.query({active: true}, function (tabs) {
            if (command === 'add_to_graffiti') {
                tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { action: 'getCurrentSymbol' }, onSymbol))
            } else if (command == 'add_to_graffiti_with_custom_edge') {
                tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { action: 'getCurrentSymbolAndEdgeInfo' }, onSymbol))
            }
        })

    });
}


function connectPullWebSocket(addr) {
    if (pullWebSocket != null) {
        if (pullWebSocket.readyState !== WebSocket.CLOSED)
            pullWebSocket.close()
        pullWebSocket = null
    }
    pullWebSocket = new WebSocket(addr);

    pullWebSocket.onopen = function (event) {
        chrome.runtime.sendMessage({ action: "getConnectPullResult", status: true }, function (response) { })
    }

    pullWebSocket.onerror = function (event) {
        chrome.runtime.sendMessage({ action: "getConnectPullResult", status: false }, function (response) { })
    }

    pullWebSocket.onclose = function (event) {
        chrome.runtime.sendMessage({ action: "getConnectPullResult", status: false }, function (response) { })
    }
    pullWebSocket.onmessage = function (event) {
        const url = event.data
        const tabBehavior = cachedSettings.tab_behavior || 'alwaysNew'
        if (tabBehavior == 'alwaysNew') {
            createNewTab(url)
        } else if (tabBehavior == 'sameIfExists') {
            const urlWithoutHashBuilder = new URL(url)
            urlWithoutHashBuilder.hash = ''
            const urlWithoutHash = urlWithoutHashBuilder.toString()

            chrome.tabs.query({}, function (tabs) {
                const matchingTabs = tabs.filter(tab => tab.url.indexOf(urlWithoutHash) >= 0 && tab.windowId != chrome.windows.WINDOW_ID_CURRENT >= 0)
                if (matchingTabs.length == 0) {
                    createNewTab(url)
                } else {
                    chrome.tabs.update(matchingTabs[matchingTabs.length - 1].id, { url: url, active: true })
                }
            });
        }
    };
}

function createNewTab(url) {
    chrome.windows.getAll({ populate: true }, function (windows) {
        const otherWindows = windows.filter(window => window.tabs.filter(tab => tab.title == 'Graffiti').length == 0)
        if (otherWindows.length) {
            // try focused one
            const otherWindowsFocused = otherWindows.filter(window => window.focused)
            if (otherWindowsFocused.length) {
                chrome.tabs.create({ url: url, windowId: otherWindowsFocused[0].id })
            } else {
                // Take the first
                chrome.tabs.create({ url: url, windowId: otherWindows[0].id })
            }
        } else {
            // Create new window
            chrome.windows.create({ url: url });
        }
    })

}



function contextClick(info, tab) {
    const { menuItemId } = info

    if (menuItemId === 'add_to_graffiti') {
        chrome.tabs.sendMessage(tab.id, { action: 'getCurrentSymbolContextMenu' }, onSymbol);
    } else if (menuItemId == 'add_to_graffiti_with_custom_edge') {
        chrome.tabs.sendMessage(tab.id, { action: 'getCurrentSymbolContextMenuAndEdgeInfo' }, onSymbol);
    }
}

function onSymbol(symbolInfo) {
    console.log(symbolInfo)

    if (symbolInfo == null) return;

    const srcDest = cachedSettings.src_dest || false
    const websocket = new WebSocket('ws://localhost:8766');
    websocket.onopen = function () {
        const data = {
            "type": "addData", "node": {
                "project": "OpenGrok: " + symbolInfo.site, 
                "address": symbolInfo.address,
                "label": symbolInfo.fileName + "::\n" + symbolInfo.sig,
                "computedProperties": []
            }, "isNodeTarget": srcDest
        }
        if (symbolInfo.edgeInfo) {
            data.edge = { label: symbolInfo.edgeInfo }
        }
        websocket.send(JSON.stringify(data));
        websocket.close()
    };
}

main()


