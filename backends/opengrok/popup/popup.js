function main() {
    chrome.storage.local.get(["tab_behavior", "src_dest"], function (result) {
        const tabBehavior = result.tab_behavior || 'alwaysNew'
        const srcDest = result.src_dest || false
        document.getElementById(tabBehavior).checked = true
        document.getElementById('srcDest').checked = srcDest
    });

    document.getElementsByName('open_in_chrome_behavior').forEach(elem => {
        elem.addEventListener('change', function (event) {
            chrome.storage.local.set({ 'tab_behavior': event.target.id });
        });
    })

    document.getElementById('srcDest').addEventListener('change', function (event) {
        chrome.storage.local.set({ 'src_dest': event.target.checked });
    });


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
            sendResponse({})
        }
    })

    chrome.runtime.sendMessage({ action: "getConnectPull" })
}


main()