chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    const yLocationContextMenu = parseInt(document.body.getAttribute("contextMenuY") || '0')
    const yLocation = parseInt(document.body.getAttribute("regularY") || '0')
    const xLocationContextMenu = parseInt(document.body.getAttribute("contextMenuX") || '0')
    const xLocation = parseInt(document.body.getAttribute("regularX") || '0')

    let y = msg.action.includes('ContextMenu') ? yLocationContextMenu : yLocation
    let x = msg.action.includes('ContextMenu') ? xLocationContextMenu : xLocation

    switch (msg.action) {
        case 'getCurrentSymbolContextMenu':
        case 'getCurrentSymbol': {
            const currentSymbol = getCurrentSymbol(x, y)
            if (currentSymbol != null) {
                sendResponse(currentSymbol)
                return
            }
            break
        }
        case 'getCurrentLineSymbolContextMenu':
        case 'getCurrentLineSymbol': {
                const currentSymbol = getCurrentLineSymbol(x, y)
                if (currentSymbol != null) {
                    sendResponse(currentSymbol)
                    return
                }
                break
        }
        case 'getCurrentSymbolContextMenuAndEdgeInfo':
        case 'getCurrentSymbolAndEdgeInfo': {
            const currentSymbol = getCurrentSymbol(x, y)
            if (currentSymbol != null) {
                let edgeInfo = prompt("Enter edge text", "");
                if (edgeInfo != null) {
                    currentSymbol.edgeInfo = edgeInfo
                    sendResponse(currentSymbol)
                    return
                }
            }
            break
        }
    }

    sendResponse(null)
    return true;
})

function getCurrentSymbol(x, y) {
    if (document.querySelectorAll('#whole_header').length == 0) {
        // TODO
        alert("Not OpenGrok")
        return null
    }

    // Copied from https://github.com/oracle/opengrok/blob/f10696b0af4c476dea4295eece5cd95fa222d136/opengrok-web/src/main/webapp/js/utils-0.0.45.js#L2211
    // but translated to pure JS and using provided y location
    let c = document.elementFromPoint(x, y);

    if (!document.getElementById('content').contains(c)) return;
    
    const par = c.closest('.scope-body, .scope-head');

    if (!par) {
        return;
    }

    const head = par.classList.contains('scope-body') ? par.previousElementSibling : par;

    const sig = head.firstChild
    const fileName = document.querySelector('#Masthead > a:last-of-type')
    let line = head.querySelector('a.l')
    if (!line) {
        line = head.querySelector('a.hl')
    }

    const url = new URL(document.location.href)
    url.hash = '#' + line.getAttribute('name')

    let sigMinimal = sig.textContent
    if (sigMinimal.includes('(')) {
        sigMinimal = sigMinimal.substring(0, sigMinimal.indexOf('(')).trim()
    }

    // TODO: support xc, xn to get class or namespace

    return {
        sig: sigMinimal,
        fileName: fileName.textContent,
        site: url.host,
        line: parseInt(line.getAttribute('name')),
        address: url.toString()
    }
}

function getCurrentLineSymbol(x, y) {
    if (document.querySelectorAll('#whole_header').length == 0) {
        // TODO
        alert("Not OpenGrok")
        return null
    }

    // Copied from https://github.com/oracle/opengrok/blob/f10696b0af4c476dea4295eece5cd95fa222d136/opengrok-web/src/main/webapp/js/utils-0.0.45.js#L2211
    // but translated to pure JS and using provided y location
    let c = document.elementFromPoint(x, y);
    
    if (!document.getElementById('content').contains(c)) return;

    while (c && !(c.classList.contains('l') || c.classList.contains('hl'))) {
        c = c.previousElementSibling;
    }

    if (c == null) return;

    const fileName = document.querySelector('#Masthead > a:last-of-type')
    const lineNumber =  parseInt(c.getAttribute('name'))

    const url = new URL(document.location.href)
    url.hash = '#' + lineNumber

    let sigMinimal = null
    
    const par = c.closest('.scope-body, .scope-head');

    if (par) {
        const head = par.classList.contains('scope-body') ? par.previousElementSibling : par;

        const sig = head.firstChild

        sigMinimal = sig.textContent
        if (sigMinimal.includes('(')) {
            sigMinimal = sigMinimal.substring(0, sigMinimal.indexOf('(')).trim()
        }
    }

    return {
        sig: sigMinimal,
        fileName: fileName.textContent,
        site: url.host,
        line: lineNumber,
        address: url.toString()
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
