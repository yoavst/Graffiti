function main() {
    chrome.storage.local.get(["tab_behavior"], function (result) {
        const tabBehavior = result.tab_behavior || 'alwaysNew'
        document.getElementById(tabBehavior).checked = true
    });

    document.getElementsByName('open_in_chrome_behavior').forEach(elem => {
        elem.addEventListener('change', function (event) {
            chrome.storage.local.set({ 'tab_behavior': event.target.id });
        });
    })

    document.getElementById('connectBtn').onclick = function (event) {
        chrome.runtime.sendMessage({ action: "connectPull", addr: document.getElementById('socketUrl').value })
    }

    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.action == 'getConnectPullResult') {
            if (msg.status === true) {
                document.getElementById("connectBtn").style.backgroundColor = "green"
            } else if (msg.status === false) {
                document.getElementById("connectBtn").style.backgroundColor = "red"
            }
        }
        sendResponse({})
        return true;
    })

    chrome.runtime.sendMessage({ action: "getConnectPull" })
}


main()