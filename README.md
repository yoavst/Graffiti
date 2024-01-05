Graffiti
========
Create customized callgraph directly from your favorite editor.

![Preview](docs/images/screenshots/screenshot.png)

## Features
* Add a node to the callgraph directly from your editor. 
* You choose what to add and where.
* Open the selected node in the editor using right click.
* Add text nodes, and comments
* Export the graph to mermaid, svg or png 
* The graph support scrolling and zooming
* Auto save to localstorage, can export to file.
* Multiple tabs
* Rename in the editor? the change will propagate to the graph.

## Architecture
![Architecture](docs/images/architecture.svg)
Graffiti was built with the following assumptions:
- You might use more than a single editor for a project.
- You might want to run everything locally.
- It should be easy to use.

Graffiti consists of 3 separate components
- **Backend** - the editor used to browse code. The editor might be native, therefore supporting TCP sockets. However, some editors are inside a browser (for example: OpenGrok). Chrome doesn't support TCP Sockets, so Backend should be able to communicate with WebSocket also. Backend should implement the following functionality:
    - Add to graph - Send the current focused symbol.
    - Pull - Get a symbol's address from the socket and open it in the editor
    - (Optional) Rename - detect rename in the editor and notify the socket.
- **Frontend** - Shows the call graph and allow you to interact with it. Should support:
    - Layout the nodes
    - Navigating the graph
    - Import and export graph
    - Undo, Redo
    - etc...
- **Server** - A middleware between the backend and the frontend. Support multiple of them in the same time, by multiplexing all the requests.
Need to support:
    - TCP editor connection
    - WebSocket editor connection
    - Websocket frontend connection

As a user, you should run the server locally. It is a single python file which depends on `websockets` library.  
The frontend is a website which you can server using `python -m http.server`.  
As for the editors, you should install an extension or the equivalance for your editor.

## Setup
In order to run Graffiti using the web frontend, you should:

1. Run the python server
```python
pip3 install -r server/requirements.txt
python3 server/main.py
```
2. start a localhost server from web dir:
```bash
cd frontend/Web
python3 -m http.server 80
```
3. From your web, enter http://localhost . Press connect to connect to the python server. The button will be green if successfully connected.
4. Follow the usage instructions for the specific backend below.

## Backends
| Editor   | Languages                            | add to graph | open in editor | Rename support | Field support | Add line to graph | Add xrefs |Socket type |
| -------- | ------------------------------------ | ------------ | -------------- | -------------- | ------------- | ----------------- | --------- | ---------- |
| JEB      | Java                                 | ✅           | ✅            | ✅            | ✅            | ✅                |    ✅    | TCP        |
| Intellij | Java, Kotlin                         | ✅           | ✅            | ❌            | ✅            | ✅                |    ✅    | TCP        |
| CLion    | C, C++                               | ✅           | ✅            | ❌            | ✅            | ✅                |    ❌    | TCP        |
| VSCode   | Depends on available language server | ✅           | ✅            | ❌            | ❌            | ✅                |    ❌    | TCP        |
| OpenGrok | *                                    | ✅           | ✅            | ❌            | ❌            | ✅                |    ❌    | Websocket  |
| IDA      | *                                    | ✅           | ✅            | ✅            | -             | ✅                |    ✅    | TCP        |
| Jadx     | Java                                 | ✅           | ✅            | ✅            | ✅            | ❌                |    ✅    | TCP        |

The common shortcuts are:
* Ctrl+Shift+A - Add a new node to the graph.
* Ctrl+Shift+X - Add a new node to the graph with a custom text on the edge.

Your cursor should be inside the function (or field in supported platforms) you want to add to the graph.

You can build all the backends using `make`, or build specific backend by running its own task.

Check [here](docs/platforms) for instructions for using graffiti on each supported platform

## Patches
### Mermaid
The project uses a the following patch to support comments on the web frontend:
```diff
diff --git a/packages/mermaid/src/diagrams/flowchart/elk/flowRenderer-elk.js b/packages/mermaid/src/diagrams/flowchart/elk/flowRenderer-elk.js
index 5ed06723..dc0fde0e 100644
--- a/packages/mermaid/src/diagrams/flowchart/elk/flowRenderer-elk.js
+++ b/packages/mermaid/src/diagrams/flowchart/elk/flowRenderer-elk.js
@@ -902,6 +902,7 @@ export const draw = async function (text, id, _version, diagObj) {
   });

   insertChildren(graph.children, parentLookupDb);
+  if (window.elk_beforeCallback) window.elk_beforeCallback(id, graph)
   log.info('after layout', JSON.stringify(graph, null, 2));
   const g = await elk.layout(graph);
   drawNodes(0, 0, g.children, svg, subGraphsEl, diagObj, 0);
```
### NinjaKeys
The projects patches out the hotkey registeration of ninja keys, since it has a bug:
```diff
diff a/ninja-keys/src/ninja-keys.ts b/ninja-keys/src/ninja-keys.ts
--- a/ninja-keys/src/ninja-keys.ts
+++ b/ninja-keys/src/ninja-keys.ts
@@ -223,10 +223,0 @@ override update(changedProperties: PropertyValues<this>) {
-      this._flatData
-        .filter((action) => !!action.hotkey)
-        .forEach((action) => {
-          hotkeys(action.hotkey!, (event) => {
-            event.preventDefault();
-            if (action.handler) {
-              action.handler(action);
-            }
-          });
-        });
```

# Credits
The logo icons created by Freepik - Flaticon.