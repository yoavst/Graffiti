const MSG_ADD_NODE_AND_EDGE = "addData";
const MSG_ADD_NODES_AND_EDGES = "addDataBulk";
const MSG_UPDATE_NODES = "updateNodes";
const NODE_LABEL = "label";
const NODE_EXTRA = "extra";
const LOCAL_STORAGE_TOKEN_KEY = "authToken";

const LOCAL_STORAGE_DEFAULT = {
  isKeymapReversed: false,
  hoverDoc: false,
  darkMode: true,
  isCurvedEdges: false,
  isFirstTime: true,
  isDomainMode: getDefaultDomainMode(),
  lastConnectedUrl: "",
};

const GRAFFITI_PLATFORMS = [
  {
    name: "JEB",
    filename: "graffiti_v{}_for_jeb.zip",
    icon: "images/platforms/JEB.png",
    color: "#6ca41b",
  },
  {
    name: "JADX",
    filename: "graffiti_v{}.jadx.kts",
    icon: "images/platforms/Jadx.svg",
    color: "#ec6038",
  },
  {
    name: "Android Studio, Intellij, Clion, PHPStorm, GoLand, Pycharm",
    filename: "graffiti_v{}_for_jetbrains.zip",
    icon: "images/platforms/jetbrains.svg",
    color: "#fe315d",
  },
  {
    name: "VSCode",
    filename: "graffiti_v{}_for_vscode.vsix",
    icon: "images/platforms/Visual_Studio_Code.svg",
    color: "#007ACC",
  },
  {
    name: "IDA",
    filename: "graffiti_v{}_for_ida.zip",
    icon: "images/platforms/IDA.png",
    color: "#c0a58f",
  },
  {
    name: "Ghidra",
    filename: "graffiti_v{}_for_ghidra.zip",
    icon: "images/platforms/Ghidra.svg",
    color: "#F44336",
  },
  {
    name: "OpenGrok, SourceGraph, Github, Gitlab",
    filename: "graffiti_v{}_for_opengrok_sourcegraph_github_gitlab.zip",
    icon: "images/platforms/websites.png",
    color: "#5484a4",
  },
];
const GRAFFITI_UTILS = [
  {
    name: "Web UI",
    filename: "graffiti_v{}_frontend_web.zip",
    icon: "images/icon.png",
    color: "#1e1f22",
  },
  {
    name: "Server",
    filename: "graffiti_v{}_server.py",
    icon: "images/platforms/python.svg",
    color: "#C9B44C",
  },
];

function event_connect() {
  const url = document.getElementById("socketUrl").value;

  // close global network controller
  if (window.networkController) window.networkController.close();

  window.networkController = new NetworkController(
    url,
    window.tabsController,
    localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY),
    () => event_showManageTokenDialog(true)
  );
}

function event_disconnect() {
  window.networkController?.close();
}

function event_reset() {
  Swal.fire({
    title: "Reset",
    text: "Do you want to clear the current tab?",
    showCancelButton: true,
  }).then(({ value = null }) => {
    if (value) {
      window.tabsController.onCurrent((_, controller) => {
        controller.reset((shouldSupportUndo = true));
      });
    }
  });
}

function event_deselect() {
  window.tabsController.onCurrent((_, controller) => {
    controller.selectNode(null);
  });
}

function event_undo() {
  window.tabsController.onCurrent((_, controller) => {
    controller.undo();
  });
}

function event_redo() {
  window.tabsController.onCurrent((_, controller) => {
    controller.redo();
  });
}

function event_delete() {
  window.tabsController.onCurrent((_, controller) => {
    controller.deleteCurrentNode();
  });
}

function event_shareGraph() {
  Swal.fire({
    title: "Share graph",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "JPEG",
    cancelButtonText: "Mermaid",
    denyButtonText: "SVG",
    input: "number",
    inputValue: "600",
    inputLabel: "dpi",
  }).then((result) => {
    window.tabsController.onCurrent((name, controller) => {
      if (result.isConfirmed) {
        // jpeg
        if (result.value) {
          controller.exportToJpeg(name, parseInt(result.value));
        }
      } else if (result.isDenied) {
        // svg
        controller.exportToSvg(name);
      } else if (result.dismiss == Swal.DismissReason.cancel) {
        // mermaid
        const s = controller.toMermaid();

        try {
          navigator.clipboard.writeText(s).then(
            function () {
              logEvent("Copied to clipboard");
            },
            function (err) {
              console.log(s);
              logEvent("Logged to console");
            }
          );
        } catch (err) {
          console.log(s);
          logEvent("Logged to console");
        }
      }
    });
  });
}

function event_center() {
  window.tabsController.onCurrent((_, controller) => {
    controller.resetScrolling();
  });
  return false;
}

function event_focusOnSelected() {
  window.tabsController.onCurrent((_, controller) => {
    controller.resetScrollingToSelected();
  });
}

function event_export() {
  tabsController.onCurrent(exportController);
}

function event_exportAll() {
  function asUniqueNames(files) {
    const names = new Set();
    const transformedArray = [];

    files.forEach((file) => {
      let { name, content } = file;
      let suffix = 1;

      while (names.has(name)) {
        name = `${file.name}_${suffix}`;
        suffix++;
      }

      names.add(name);
      transformedArray.push({ name, content });
    });

    return transformedArray;
  }

  const tarWriter = new tarball.TarWriter();
  const files = asUniqueNames(
    tabsController.map((name, tabController) => ({
      name,
      content: tabController.export(),
    }))
  );

  files.forEach(({ name, content }) =>
    tarWriter.addTextFile(`${name}.json`, content)
  );
  tarWriter.download("graffiti_export.tar");
  return false;
}

function exportController(name, controller) {
  const blob = new Blob([controller.export()]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = name + ".json";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function event_import() {
  readFile = function (e) {
    for (const file of e.target.files) {
      event_import_onFile(file);
    }
  };

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.style.display = "none";
  fileInput.onchange = readFile;
  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
}

function event_import_onFile(file) {
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    // If we have only empty untitled tab, remove it
    const tabsController = window.tabsController;
    if (
      tabsController.count() == 1 &&
      tabsController.tabs[0].name == "untitled" &&
      tabsController.tabs[0].tabController.nodes.size() == 0
    ) {
      tabsController.removeTab(0);
    }

    const contents = e.target.result;
    if (isTARFile(contents)) {
      let tar = new tarball.TarReader();
      tar.readArrayBuffer(contents).forEach((fileInfo) => {
        const addedTab = tabsController.addTab(fileInfo.name);
        tabsController.selectTab(addedTab);
        tabsController.onCurrent((_, controller) => {
          controller.import(tar.getTextFile(fileInfo.name));
        });
      });
    } else {
      let name = file.name;
      if (name.endsWith(".json")) {
        name = name.substring(0, name.length - 5);
      }

      const addedTab = tabsController.addTab(name);
      tabsController.selectTab(addedTab);
      tabsController.onCurrent((_, controller) => {
        controller.import(new TextDecoder("utf-8").decode(contents));
      });
    }
  };
  reader.readAsArrayBuffer(file);
}

function event_addTab() {
  Swal.fire({
    title: "Add graph",
    input: "text",
    inputValue: "",
    showCancelButton: true,
  }).then(({ value = null }) => {
    if (value != null && value != "") {
      const tab = window.tabsController.addTab(value);
      window.tabsController.selectTab(tab);
    }
  });
}

function event_addTabFromNode() {
  window.tabsController.onCurrent((_, controller) => {
    if (controller.selectedNode == null) {
      Swal.fire({
        title: "No selected node to create new graph from",
        position: "bottom-end",
        toast: true,
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }
    let nodeName = controller.selectedNode.label;
    Swal.fire({
      title: "Add graph from Node",
      input: "text",
      inputValue: nodeName,
      showCancelButton: true,
    }).then(({ value = null }) => {
      if (value != null && value != "") {
        const tab = window.tabsController.addTab(value);
        window.tabsController.selectTab(tab);
        tab.tabController.addNode(
          controller.selectedNode[(NODE_LABEL, NODE_EXTRA)]
        );
      }
    });
  });
}

function event_toggleRenderer() {
  window.tabsController.onCurrent((_, controller) => {
    controller.onToggleRenderer();
  });
  return false;
}

function event_toggleFocusTarget() {
  document.getElementById("isNewWillBeSelected").click();
  return false;
}

function event_toggleArrowTarget() {
  document.getElementById("isExistingToNew").click();
}

function event_toggleHelp() {
  const currentHideHelpBar =
    (localStorage.getItem("__HIDE_HELP_BAR") || "false") === "true";
  localStorage.setItem("__HIDE_HELP_BAR", !currentHideHelpBar);

  setHelpBarAppearance();
}

function setHelpBarAppearance() {
  const currentHideHelpBar =
    (localStorage.getItem("__HIDE_HELP_BAR") || "false") === "true";
  if (currentHideHelpBar) {
    document.getElementsByTagName("footer")[0].style.display = "none";
  } else {
    document.getElementsByTagName("footer")[0].style.removeProperty("display");
  }
}

function handleDarkMode() {
  if (isDarkMode()) {
    document.documentElement.classList.remove("lightTheme");
    document.querySelector("ninja-keys").classList.add("dark");
  } else {
    document.documentElement.classList.add("lightTheme");
  }
}

function event_setTheme(themeIndex) {
  window.tabsController.onCurrent((_, controller) => {
    controller.onSetTheme(themeIndex);
  });
}

function event_addTextNode() {
  addTextualNode("Add text node", { isMarkdown: true });
}

function event_addComment() {
  window.tabsController.onCurrent((_, controller) => {
    if (controller.selectedNode == null) {
      Swal.fire({
        title: "No selected node to comment",
        position: "bottom-end",
        toast: true,
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    addTextualNode(
      "Add comment",
      { isMarkdown: true, isComment: true, isUnclickable: true },
      { isExistingToNew: true }
    );
  });
}

function addTextualNode(
  title,
  extra_node_properties,
  extra_edge_properties = {}
) {
  // FIXME: don't depend on network controller
  if (!("networkController" in window)) {
    Swal.fire({
      title: "Not connected",
      position: "bottom-end",
      toast: true,
      showConfirmButton: false,
      timer: 3000,
    });
    return;
  }

  Swal.fire({
    title: title,
    input: "textarea",
    inputValue: "",
    footer: "You can use **text** for bold, and *text* for italic",
    showCancelButton: true,
    didOpen: patchOnKeyDown,
  }).then(({ value = null }) => {
    if (value != null && value != "") {
      // Bit of a hack, but why not
      window.networkController.handleMessage({
        type: MSG_ADD_NODE_AND_EDGE,
        node: {
          label: value,
          ...extra_node_properties,
        },
        edge: extra_edge_properties,
      });
    }
  });
}

function event_search() {
  window.tabsController.onCurrent((_, controller) => {
    const searchResults = controller.getSearchResults();
    if (searchResults.length != 0) {
      const ninja = document.querySelector("ninja-keys");
      ninja.setAttribute("placeholder", "Search node in current graph");
      ninja.setAttribute("hideBreadcrumbs", "");
      ninja.data = searchResults;
      ninja.open();
    } else {
      logEvent("Empty graph");
    }
  });
}

function event_searchAll() {
  const searchResults = window.tabsController
    .map((name, controller, index) => {
      return controller.getSearchResults().map((result) => {
        result.section = name;
        result.id = `${index}@@${result.id}`;
        const originalHandler = result.handler;
        result.handler = () => {
          window.tabsController.selectTabByIndex(index);
          originalHandler();
        };
        return result;
      });
    })
    .flatMap((l) => l);

  if (searchResults.length != 0) {
    const ninja = document.querySelector("ninja-keys");
    ninja.setAttribute("placeholder", "Search node in all graphs");
    ninja.setAttribute("hideBreadcrumbs", "");
    ninja.data = searchResults;
    ninja.open();
  } else {
    logEvent("Empty graphs");
  }
  return false;
}

function event_removeCurrentTab() {
  Swal.fire({
    title: "Remove tab",
    text: "Are you sure you want to remove the current tab",
    showCancelButton: true,
  }).then(({ value = null }) => {
    if (value) {
      window.tabsController.removeCurrentTab();
    }
  });
}

function event_renameCurrentTab() {
  window.tabsController.renameCurrentTab();
}

function event_showSourcesCurrentTab() {
  window.tabsController.onCurrent((_, tabController) => {
    window.tabsController.openSourcesForTab(tabController);
  });
}

function event_addEdgeBetweenSelected() {
  window.tabsController.onCurrent((_, tabController) => {
    tabController.addNodeBetweenSelected();
  });
}

function event_overrideLabel() {
  window.tabsController.onCurrent((_, tabController) => {
    tabController.overrideCurrentNodeLabel();
  });
}

function event_commandPalette() {
  window.commandPalette.open();
}

function event_help() {
  const toHtml = function ({ name, icon, color, filename }) {
    return `<li class="material-item">
            <img src="${icon}" class="material-icon"></img>
            <span class="material-title">${name}</span>
            <button class="material-btn" style="background-color: ${color};" onclick="event_showDocs('${name}')">Docs</button>
            <button class="material-btn" style="background-color: ${color};" onclick="event_downloadPlatform('${filename}')">Download</button>
        </li>`;
  };
  const twoPanePlatforms = GRAFFITI_PLATFORMS.filter(
    (platform) => platform.name.length <= 10
  ).map(toHtml);
  const onePanePlatforms = GRAFFITI_PLATFORMS.filter(
    (platform) => platform.name.length > 10
  ).map(toHtml);
  const utilsHtml = GRAFFITI_UTILS.map(toHtml);

  const html = `<div class="platforms">
        <p><i>Create customized callgraph directly from your favorite editor.</i></p>
        <br>
        <p>To run graffiti, you have to run the python server, and activate the graffiti plugin on your IDE</p>
        <p>If you use a multi-user server, you can get the auth token from the key button on the top right of the screen. 
           The key is cached for the backends at <code>~/.graffiti/token</code></p>
        <div id="utils">
        ${utilsHtml.join("")}
        </div>
        <hr class="material-divider">
        <h2>Supported Platforms</h2>
        <div id="one-pane-supported-platforms">
        ${onePanePlatforms.join("")}
        </div>
        <div id="two-pane-supported-platforms">
        ${twoPanePlatforms.join("")}
        </div>
    </div>`;

  Swal.fire({
    title: "Graffiti V" + window.versionStr,
    html: html,
    width: "50em",
    confirmButtonText: "Close",
  });
}

function event_downloadPlatform(filename) {
  filename = filename.replace("{}", window.versionStr);
  const link = document.createElement("a");
  link.href = `out/${filename}`;
  link.setAttribute("download", "");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function event_showDocs(platform) {
  fetch(`docs/platforms/${platform}.md`)
    .then((r) => r.text())
    .then((text) => new showdown.Converter().makeHtml(text))
    .then((html) => {
      Swal.fire({
        title: platform,
        html: `<div class="left">${html}</div>`,
        confirmButtonText: "Close",
        width: "48em",
      }).then((_) => {
        // Go back to the help section
        event_help();
      });
    });
}

function event_showChangelog() {
  fetch(`CHANGELOG.md`)
    .then((r) => r.text())
    .then((text) => new showdown.Converter().makeHtml(text))
    .then((html) => {
      Swal.fire({
        html: `<div class="left" style="max-height: 75vh; overflow-y: auto;">${html}</div>`,
        title: "Changelog",
        confirmButtonText: "Close",
        width: "48em",
      });
    });
}

function event_showManageTokenDialog(isFromAuthEvent = false) {
  const currentToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
  const isWindows = navigator.userAgent.includes("Windows NT");
  const tokenPath = isWindows
    ? "%USER_PROFILE%/.graffiti/token"
    : "~/.graffiti/token";
  let msg =
    "Graffiti uses a token to authenticate you in a connection to a multi-user server. " +
    "The token is a random UUID V4, which should be shared between the frontend and the backend. " +
    `It is saved locally at <code>${tokenPath}</code> after connecting a backend for the first time. The frontend also caches its token on localstorage.<br /><br />`;

  if (currentToken == null || currentToken.length == 0) {
    msg +=
      "<b>You have not generated token yet! Copy it from your computer, or use 'Generate new token'.</b>";
  } else {
    msg +=
      "If you already connected a backends and the token is not the same to the one here, you can replace the key here to the one you have.";
  }

  Swal.fire({
    title: "Multi-User Token",
    input: "text",
    inputValue: currentToken || "",
    html: msg,
    footer:
      "<p>You can ignore this if <code>--multi-user-mode</code> not enabled</p>",
    showDenyButton: true,
    showCloseButton: true,
    denyButtonText: "Generate new token",
    confirmButtonText: "Save",
    inputValidator: (value) => {
      if (!value || !isValidUUIDv4(value.trim())) {
        return "The token must be a valid UUID v4";
      }
    },
    preDeny: () => {
      Swal.getInput().value = generateUuidv4();
      return false;
    },
  }).then((res) => {
    if (res.isConfirmed) {
      const oldKey = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, res.value);
      if (isFromAuthEvent) {
        // Just reconnect and now it will be with token
        event_connect();
      } else if (oldKey != res.value) {
        event_disconnect();
      }
    } else if (res.isDismissed && isFromAuthEvent) {
      event_disconnect();
    }
  });
}

function main() {
  initiateLocalStorage();
  initiateDependencies();
  initiateHotkeys();
  initializeDragAndDrop();
  initiateCheckForUpdates();
  initiateConnectionUrl();
  setHelpBarAppearance();
  handleDarkMode();

  // Initiate tabs
  const tabsController = new TabsController(
    document.getElementsByClassName("tabs")[0],
    document.getElementsByClassName("view")[0],
    document.getElementById("context-menu")
  );
  tabsController.restore();

  window.tabsController = tabsController;

  // initiate command palatte
  window.commandPalette = new CommandPalette(
    tabsController,
    document.querySelector("ninja-keys")
  );

  if (strToBool(localStorage.getItem("isFirstTime"))) {
    event_help();
    localStorage.setItem("isFirstTime", false);
  }
}

function initiateDependencies() {
  // Initiate mermaid
  mermaid.initialize({
    securityLevel: "loose",
    theme: "forest",
    useMaxWidth: true,
  });
  // Fix tippy
  tippy.setDefaultProps({ maxWidth: "" });
}

function elk_beforeCallback(id, graph) {
  tabsController.onId(id, (_, controller) => {
    controller.modifyElkGraph(graph);
  });
}

function initiateConnectionUrl() {
  const urlInput = document.getElementById("socketUrl");

  const protocol =
    location.protocol == "https:" && !shouldForceWs() ? "wss" : "ws";
  const isDomain = strToBool(localStorage.getItem("isDomainMode"));
  const domain = isDomain ? location.host : "localhost";
  const connectionUrl = `${protocol}://${domain}:8503`;

  urlInput.placeholder = connectionUrl;

  const lastConnectedUrl = localStorage.getItem("lastConnectedUrl");
  urlInput.value = lastConnectedUrl || connectionUrl;
}

function initiateHotkeys() {
  hotkeys(
    "esc,ctrl+z,ctrl+shift+z,ctrl+y,ctrl+s,ctrl+alt+s,ctrl+o,ctrl+i,ctrl+alt+shift+i,ctrl+q,ctrl+f,ctrl+shift+f,ctrl+k,ctrl+e,ctrl+shift+q,ctrl+shift+p,delete,home,ctrl+home,shift+`,shift+/,ctrl+shift+/,ctrl+a,1,2,3,4,5,6,7,8,9",
    function (event, handler) {
      window.commandPalette.close();
      switch (handler.key) {
        case "esc":
          event_deselect();
          return false;
        case "ctrl+z":
          event_undo();
          return false;
        case "ctrl+shift+z":
        case "ctrl+y":
          event_redo();
          return false;
        case "ctrl+s":
          event_export();
          return false;
        case "ctrl+alt+s":
          event_exportAll();
          return false;
        case "ctrl+o":
          event_import();
          return false;
        case "ctrl+i":
          event_toggleArrowTarget();
          return false;
        case "ctrl+alt+shift+i":
          event_toggleFocusTarget();
          return false;
        case "ctrl+k":
          event_showManageTokenDialog();
          return false;
        case "ctrl+q":
          event_addComment();
          return false;
        case "ctrl+shift+q":
          event_addTextNode();
          return false;
        case "delete":
          event_delete();
          return false;
        case "home":
          event_focusOnSelected();
          return false;
        case "ctrl+home":
          event_center();
          return false;
        case "shift+/":
          event_help();
          return false;
        case "ctrl+shift+/":
          event_toggleHelp();
          return false;
        case "shift+`":
          event_toggleRenderer();
          return false;
        case "ctrl+f":
          event_search();
          return false;
        case "ctrl+shift+f":
          event_searchAll();
          return false;
        case "ctrl+shift+p":
          event_commandPalette();
          return false;
        case "ctrl+a":
          event_addTabFromNode();
          return false;
        case "ctrl+e":
          event_overrideLabel();
          return false;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          themeIndex = parseInt(event.key) - 1;
          event_setTheme(themeIndex);
          return;
      }
    }
  );
}

function initializeDragAndDrop() {
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    document.body.addEventListener(
      eventName,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      false
    );
  });

  document.body.addEventListener(
    "drop",
    function handleDrop(e) {
      for (const file of e.dataTransfer.files) {
        event_import_onFile(file);
      }
    },
    false
  );
}

function initiateLocalStorage() {
  for (const key of Object.keys(LOCAL_STORAGE_DEFAULT)) {
    if (localStorage.getItem(key) == null) {
      localStorage.setItem(key, LOCAL_STORAGE_DEFAULT[key]);
    }
  }
}

function initiateCheckForUpdates() {
  checkForUpdates();
  // Check every 3 hours
  setInterval(checkForUpdates, 1000 * 60 * 60 * 3);
}

function checkForUpdates() {
  fetch("version.txt", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) {
        throw new Error("Network response was not ok");
      }
      return r.text();
    })
    .then((version) => {
      version = version.trim();
      if (
        version != window.versionStr &&
        !window.versionStr.includes("VERSION")
      ) {
        // new version
        Swal.fire({
          title: `New graffiti version is available: ${version}. Refresh for new goodies 😊`,
          position: "bottom-end",
          showCancelButton: true,
          cancelButtonText: "Show changelog",
          toast: true,
        }).then((result) => {
          console.log(result);
          if (result.dismiss === "cancel") {
            event_showChangelog();
          }
        });
      }
    });
}

function isValidUUIDv4(uuid) {
  const uuidv4Regex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i;
  return uuidv4Regex.test(uuid);
}

function generateUuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

function getDefaultDomainMode() {
  // On localhost domain mode doesn't matter as the urls are the same.
  // On graffiti.quest we don't want to enable domain mode
  return location.hostname != "graffiti.quest";
}

function shouldForceWs() {
  // People using graffiti.quest still setup localhost server
  return location.hostname == "graffiti.quest";
}

main();
