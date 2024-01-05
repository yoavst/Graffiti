let graffitiWebSocket = null
let cachedSettings = {}

function main() {
    // Cache settings
    chrome.storage.local.get(["tab_behavior"], function (result) {
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

    chrome.contextMenus.create({
        id: 'add_line_to_graffiti',
        title: 'Add current line to Graph',
        contexts: ['page']
    })
    chrome.contextMenus.onClicked.addListener(contextClick)

    // Handle connection commands
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.action == 'getConnectPull') {
            sendResponse({})

            if (graffitiWebSocket == null) chrome.runtime.sendMessage({ action: "getConnectPullResult" })
            else if (graffitiWebSocket.readyState === WebSocket.CLOSED) chrome.runtime.sendMessage({ action: "getConnectPullResult", status: false })
            else chrome.runtime.sendMessage({ action: "getConnectPullResult", status: true })
        } else if (msg.action == 'connectPull') {
            sendResponse({})
            connectPullWebSocket(msg.addr)
        }
        return true;
    })

    // Handle keyboard commands
    chrome.commands.onCommand.addListener(function (command) {
        chrome.tabs.query({active: true}, function (tabs) {
            if (command === 'add_to_graffiti') {
                tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { action: 'getCurrentSymbol' }, onSymbol))
            } else if (command == 'add_to_graffiti_with_custom_edge') {
                tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { action: 'getCurrentSymbolAndEdgeInfo' }, onSymbol))
            }  else if (command == 'add_line_to_graffiti') {
                tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { action: 'getCurrentLineSymbol' }, onLineSymbol))
            }
        })

    });
}


function connectPullWebSocket(addr) {
    if (graffitiWebSocket != null) {
        if (graffitiWebSocket.readyState !== WebSocket.CLOSED)
            graffitiWebSocket.close()
        graffitiWebSocket = null
    }
    const tmpSocket = new WebSocket(addr)
    graffitiWebSocket = tmpSocket

    graffitiWebSocket.onopen = function (event) {
        chrome.runtime.sendMessage({ action: "getConnectPullResult", status: true }, function (response) { })
    }

    graffitiWebSocket.onerror = function (event) {
        chrome.runtime.sendMessage({ action: "getConnectPullResult", status: false }, function (response) { })
        if (graffitiWebSocket == tmpSocket) {
            graffitiWebSocket = null
        }
    }

    graffitiWebSocket.onclose = function (event) {
        chrome.runtime.sendMessage({ action: "getConnectPullResult", status: false }, function (response) { })
        if (graffitiWebSocket == tmpSocket) {
            graffitiWebSocket = null
        }
    }
    graffitiWebSocket.onmessage = function (event) {
        const data = JSON.parse(event.data)
        if ('project' in data) {
            if (!data['project'].startsWith('OpenGrok:')) {
                return
            }
        }
        const url = data.address
        
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
    } else if (menuItemId == 'add_line_to_graffiti') {
        chrome.tabs.sendMessage(tab.id, { action: 'getCurrentLineSymbolContextMenu' }, onLineSymbol);
    }
}

function onSymbol(symbolInfo) {
    console.log(symbolInfo)

    if (symbolInfo == null) {
        chrome.notifications.create(
            "noSymbol",
            {
              type: "basic",
              iconUrl: "images/icon.png",
              title: 'Graffiti',
              message: 'Could not find symbol in this line'
            }
          );
        return
    }

    const websocket = graffitiWebSocket
    if (websocket == null) {
        chrome.notifications.create(
            "notConnected",
            {
              type: "basic",
              iconUrl: "images/icon.png",
              title: 'Graffiti',
              message: 'Not connected to server'
            }
          )
        return
    }

    const data = {
        "type": "addData", "node": {
            "project": "OpenGrok: " + symbolInfo.site, 
            "address": symbolInfo.address,
            "label": symbolInfo.fileName + "::\n" + symbolInfo.sig,
            "computedProperties": []
        }
    }
    if (symbolInfo.edgeInfo) {
        data.edge = { label: symbolInfo.edgeInfo }
    }
    websocket.send(JSON.stringify(data));
}

function onLineSymbol(symbolInfo) {
    console.log(symbolInfo)

    if (symbolInfo == null) {
        chrome.notifications.create(
            "noLine",
            {
              type: "basic",
              iconUrl: "images/icon.png",
              title: 'Graffiti',
              message: 'Could not find a line'
            }
          );
        return
    }

    const websocket = graffitiWebSocket
    if (websocket == null) {
        chrome.notifications.create(
            "notConnected",
            {
              type: "basic",
              iconUrl: "images/icon.png",
              title: 'Graffiti',
              message: 'Not connected to server'
            }
          )
        return
    }
    
    const label = symbolInfo.sig ? 
                    (symbolInfo.fileName + "::\n" + symbolInfo.sig + ":" + symbolInfo.line) :
                    (symbolInfo.fileName + ":" + symbolInfo.line)

    const data = {
        "type": "addData", "node": {
            "project": "OpenGrok: " + symbolInfo.site, 
            "address": symbolInfo.address,
            "label": label,
            "line": symbolInfo.line,
            "computedProperties": []
        }
    }
    if (symbolInfo.edgeInfo) {
        data.edge = { label: symbolInfo.edgeInfo }
    }
    websocket.send(JSON.stringify(data));
}

main()


