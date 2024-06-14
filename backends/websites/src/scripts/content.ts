import { SymbolProvider, onExtMessageEx, reject } from "./shared";
import * as Providers from "./providers";

const SYMBOL_PROVIDERS: SymbolProvider[] = [
    new Providers.OpenGrokProvider(),
    new Providers.SourceGraphProvider(),
    new Providers.GithubProvider(),
    new Providers.GitlabProvider(),
];

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

            Promise.any<SymbolProvider>(
                SYMBOL_PROVIDERS.map((provider) => (provider.isSupported() ? provider : reject())),
            )
                .catch(() => {
                    // report error but still reject
                    sendResponse({ isCorrectWebsite: false, info: null });
                    return reject<SymbolProvider>();
                })
                .then((provider) => {
                    return msg.isLine ? provider.getCurrentLineSymbol(x, y) : provider.getCurrentSymbol(x, y);
                })
                .then((currentSymbol) => {
                    if (msg.askForEdgeText) {
                        const edgeText = prompt("Enter edge text", "");
                        if (edgeText != null) {
                            currentSymbol.edgeLabel = edgeText;
                        }
                    }

                    sendResponse({
                        isCorrectWebsite: true,
                        info: currentSymbol,
                    });
                })
                .catch((e) => {
                    console.log("Graffiti error:", e);
                    // For mattching site but not matching symbol
                    sendResponse({
                        isCorrectWebsite: true,
                        info: null,
                    });
                });

            return;
        }

        sendResponse({ isCorrectWebsite: false, info: null });
    });
}

main();
