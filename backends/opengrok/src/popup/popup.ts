import { getPrefs, setPrefs, TabBehavior, onExtMessage, sendExtMessage } from "../scripts/shared";

function getInputById(id: string): HTMLInputElement {
    return document.getElementById(id) as HTMLInputElement;
}

function main() {
    getPrefs((prefs) => {
        getInputById(prefs.tabBehavior).checked = true;
    });

    document.getElementsByName("open_in_chrome_behavior").forEach((elem) => {
        elem.addEventListener("change", (event) => {
            setPrefs({
                tabBehavior: (event.target as HTMLInputElement).id as TabBehavior,
            });
        });
    });

    document.getElementById("connectBtn")!.onclick = (_) => {
        sendExtMessage({
            action: "connectPull",
            addr: getInputById("socketUrl").value,
        });
    };

    onExtMessage((extMsg) => {
        if (extMsg.action == "getConnectionPullResult") {
            if (extMsg.status) {
                document.getElementById("connectBtn")!.style.backgroundColor = "green";
            } else {
                document.getElementById("connectBtn")!.style.backgroundColor = "red";
            }
        }
    });

    sendExtMessage({ action: "getConnectionPullRequest" });
}

main();
