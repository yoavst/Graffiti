import { SymbolProvider, onExtMessageEx } from "./shared";
import OpenGrokProvider from "./opengrok";
import SourceGraphProvider from "./sourcegraph";

const SYMBOL_PROVIDERS: Array<SymbolProvider> = [new OpenGrokProvider(), new SourceGraphProvider()];

function main() {
    const s = document.createElement("script");
    const url = chrome.runtime.getURL("js/injected_to_page.js");
    s.src = url;
    s.onload = function () {
        (this as HTMLElement).remove();
    };
    (document.head || document.documentElement).appendChild(s);

    onExtMessageEx((msg, sendResponse) => {
        if (msg.action === "getSymbolRequest") {
            const yLocationContextMenu = parseInt(document.body.getAttribute("contextMenuY") || "0");
            const yLocation = parseInt(document.body.getAttribute("regularY") || "0");
            const xLocationContextMenu = parseInt(document.body.getAttribute("contextMenuX") || "0");
            const xLocation = parseInt(document.body.getAttribute("regularX") || "0");

            const [x, y] =
                msg.source == "contextMenu" ? [xLocationContextMenu, yLocationContextMenu] : [xLocation, yLocation];

            for (const provider of SYMBOL_PROVIDERS) {
                if (!provider.isSupported()) continue;

                const currentSymbol = (msg.isLine ? provider.getCurrentLineSymbol : provider.getCurrentSymbol)(x, y);
                if (currentSymbol != null && msg.askForEdgeText) {
                    const edgeText = prompt("Enter edge text", "");
                    if (edgeText != null) {
                        currentSymbol.edgeLabel = edgeText;
                    }
                }

                sendResponse({
                    isCorrectWebsite: true,
                    info: currentSymbol,
                });
                return;
            }

            sendResponse({ isCorrectWebsite: false, info: null });
            return;
        }

        sendResponse({ isCorrectWebsite: false, info: null });
    });
}

main();
