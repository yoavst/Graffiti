import {
    getPrefs,
    setPrefs,
    TabBehavior,
    onExtMessage,
    sendExtMessage,
    isValidUUIDv4,
    onPrefsChanged,
} from "../scripts/shared";

function getInputById(id: string): HTMLInputElement {
    return document.getElementById(id) as HTMLInputElement;
}

function main() {
    const tokenInput = getInputById("token");
    const socketInput = getInputById("socketUrl");

    getPrefs((prefs) => {
        getInputById(prefs.tabBehavior).checked = true;
        tokenInput.value = prefs.token;
        socketInput.value = prefs.lastConnectedServer;
    });

    onPrefsChanged((prefs) => {
        socketInput.value = prefs.lastConnectedServer;
    });

    tokenInput.onchange = (_) => {
        setPrefs({
            token: tokenInput.value,
        });
    };
    tokenInput.oninput = (_) => {
        if (isValidUUIDv4(tokenInput.value)) {
            tokenInput.setCustomValidity("");
        } else {
            tokenInput.setCustomValidity("Graffiti token should be a valid UUID v4 taken from Graffiti website");
        }
        tokenInput.reportValidity();
    };

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
            addr: socketInput.value,
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
