## 1.11.0

### General

- [Feature] Add multi-user-mode support to all the backends and the web frontend.
- [CI/CD] Add CI/CD that also publishes automatically to [graffiti.quest](https://graffiti.quest)!
- [Packaging] Use @ykaridi PyBunch for packging python scripts.
- [Code] Formatted most of the code using prettier and ruff.

### Server

- [Rewrite] Full rewrite of the server.
- [Feature] Prints stats on pressing enter from the CLI.
- [Feature] Added cli options to change the ports used by the server.
- [Packaging] Can be installed as a pip library, and run as `graffiti-server`.

### IDA

- [Feature] use pywin32 to reliably bring the IDA window to the foreground (thanks @noaml13)

## 1.10.0

### Web

- [Feature] Create new tab from existing node (thanks @YanirLA)
- [Feature] Now "override text node" has a shortcut - ctrl+e

### IDA

- [Feature] Use demangled name instead of original name
- [Feature] Now it's plugin instead of script. See new installation's instructions.
- [Feature] Now clicking a node will make IDA focused.

### Opengrok

- [Rewrite] Rewrite opengrok plugin in typescript

### Sourcegraph

- [Feautre] Support for Java and C/C++!

## 1.9.0

### Web

- [Feature] Add documentations and downloads to the web frontend. Now you can use `?` to download all backends.
- [Feautre] Add changelog to the web frontend. Available from command palette
- [Feature] Check for graffiti frontend on server every 3 hours.

### General

- [Build] Move version info to version.txt file
- [Docs] Add changelog.md

## 1.8.4

### Opengrok

- [Feature] Line nodes are supported (note: you must be over an element, not an empty space)
- [Build] Version is now synced to graffiti version

### Web

- [Feature] export all files to tar, and import tar

## 1.8.3

### Web

- [Feature] Add override label (activate via command palette)

### IDA

- [Feature] Line nodes - add node to every address
- [Feature] Add all (line) xrefs

### Jadx

- [Bug] Support renamed classes/methods
- [Feature] Add all xrefs

### General

- [Bug] Fix support for non-unicode symbols (thanks @rootatkali)

## 1.8.2

### Web

- [Feature] Support both markdown and html hover
- [Bug] Return `htmlLabels` for now. As a result, the generated SVG is web only.

### Intellij

- [Feature] Add line nodes
- [Feature] Add xrefs support

### CLion

Initial support!

## 1.8.1

### VSCode

- [Bug] Support line nodes in global scope
- [Bug] Fix crash in scopefinder by creating a new one each graffiti use

## 1.8.0

### Web

- [Feature] Add command palette
- [Feature] Add a command for adding an edge from the currently selected to an existing node
- [Feature] Search node in current or in all graphs
- [Feature] Export to SVG/PNG
- [Performance] On adding multiple nodes, draw after all are added
- [Feature] Add support for curved edges
- [UI] Change color for edges in dark mode
- [Debug] add `?light` or `?dark` to the URL to override the theme.

### Jeb

- [Bug] Improve navigation in JEB by @ykaridi
- [Feature] New script to sync all the symbols from JEB to graffiti

### Server

- [Performance] Removed dumping messages sent to server unless `--dump` is provided.

### New Contributors

@ykaridi made their first contribution in #3

## 1.7.1

### Web

- [Feature] Add more shortcuts
- [Feature] More colors, colors for text nodes and comments
- [Feature] Dark mode
- [Feature] Drag & Drop tabs
- [Feature] home now send you to the current node
- [Performance] Redraw on update only if necessary, improve selection performance
- [Bug] Fix middle click support
- [Bug] Fix arrow to comment sometimes have direction

### Jeb

- [Feature] Add xrefs to line
- [Bug] Fix line nodes renaming

## 1.6.0

### VScode

- [Bug] Fix scoping bug for python
- [Debug] Move logs to debug channel

### Jeb

- [Feature] Support for line nodes and class nodes

### Web

- [Feature] Special marking for line nodes
- [Feature] Two new themes for nodes
- [Feature] Ctrl+Enter in dialogs
- [Feature] Swap nodes using middle click (and ctrl, shift modifiers)
- [Deps] Update mermaid version to 1.5.0
- [Deps] Drop visjs dataset dependency

## 1.4.0

### VSCode

- [Bug] Support for rust and typescript symbols (by adding more scope types).
- [Feature] New address format - now can track symbol instead of line. You'll be able to use the same graffiti file for multiple commits!
  - Added new command for transforming old files to symbol based.
- [Feature] New nodes will now send hover documentation to graffiti

### Intellij

- [Feature] New nodes will now send hover documentation to graffiti

### Web

- [Bug] Fix shadow on right click
- [Bug] Escape meta chars in text/comment nodes.
- [Experimental] Added experimental hover documentation for supported nodes. You need to enable this from local storage

## 1.3.0

### Web

- Try to fix edges order on ELK
- New comment look
- switch modify edge to right click
- Add alt text for connection status
- bug fix for comments

### General

- Add Makefile for quickly generating release
- Add new (experimental) JADX backend. Currently it only works on JADX's master, but eventually it will be release.

## 1.2.0

### Web

- Fix flickering text (especially visible on ELK mode)
- Confirmation for reset tab
- Comments nodes! Supported on ELK Mode, compatible with the old node.\
- Elk is now the default mode.
- Try to preserve order of nodes even after undo/redo operation (by sorting the graph before building it)

### VSCode

- [Feature] specific line nodes,
- [Feature] notification on successful connection
- [Bug] bug fixes.

## 1.1.0

### Web

- [Feature] Markdown nodes
- [Feature] Choose theme for nodes
- [WIP] initial elk render support

### General

- [Feature] Switch protocol over TCP to be `<4 length bytes> <content>`, to support long messages

## 1.0.0

First stable release!

## 0.2.1

- New icons
- Support for hotkeys
- Smaller network size
- Bug fixes with tabs

## 0.2

- Tabs for Web

## 0.1.1

- Added kotlin files support for Intellij
