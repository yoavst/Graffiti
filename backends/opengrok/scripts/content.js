chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    const yLocationContextMenu = parseInt(document.body.getAttribute("contextMenuY") || '0')
    const yLocation = parseInt(document.body.getAttribute("regularY") || '0')

    if (msg.action === 'getCurrentSymbolContextMenu') {
        const currentSymbol = getCurrentSymbol(yLocationContextMenu)
        if (currentSymbol != null) {
            sendResponse(currentSymbol)
            return
        }
    } else if (msg.action == 'getCurrentSymbolContextMenuAndEdgeInfo') {
        const currentSymbol = getCurrentSymbol(yLocationContextMenu)
        if (currentSymbol != null) {
            let edgeInfo = prompt("Enter edge text", "");
            if (edgeInfo != null) {
                currentSymbol.edgeInfo = edgeInfo
                sendResponse(currentSymbol)
                return
            }
        }
    } else if (msg.action === 'getCurrentSymbol') {
        const currentSymbol = getCurrentSymbol(yLocation)
        if (currentSymbol != null) {
            sendResponse(currentSymbol)
            return
        }
    } else if (msg.action == 'getCurrentSymbolAndEdgeInfo') {
        const currentSymbol = getCurrentSymbol(yLocation)
        if (currentSymbol != null) {
            let edgeInfo = prompt("Enter edge text", "");
            if (edgeInfo != null) {
                currentSymbol.edgeInfo = edgeInfo
                sendResponse(currentSymbol)
                return
            }
        }
    } else {
        return
    }
    sendResponse(null)
})

function getCurrentSymbol(yLocation) {
    if (document.querySelectorAll('#whole_header').length == 0) {
        // TODO
        alert("Not OpenGrok")
        return null
    }

    // Copied from https://github.com/oracle/opengrok/blob/f10696b0af4c476dea4295eece5cd95fa222d136/opengrok-web/src/main/webapp/js/utils-0.0.45.js#L2211
    // but translated to pure JS and using provided y location
    const c = document.elementFromPoint(15, yLocation);

    if (c.classList.contains('l') || c.classList.contains('hl')) {
        const par = c.closest('.scope-body, .scope-head');

        if (!par) {
            return;
        }

        const head = par.classList.contains('scope-body') ? par.previousElementSibling : par;

        const sig = head.firstChild
        const fileName = document.querySelector('#Masthead > a:last-of-type')
        const line = head.querySelector('a.l')

        const url = new URL(document.location.href)
        url.hash = '#' + line.getAttribute('name')

        // TODO support xc, xn to get class or namespace

        return {
            sig: sig.textContent,
            fileName: fileName.textContent,
            line: parseInt(line.getAttribute('name')),
            address: url.toString()
        }
    }
}


function main() {
    const s = document.createElement('script');
    const url = chrome.runtime.getURL('scripts/injected_to_page.js')
    s.src = url;
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

main()
