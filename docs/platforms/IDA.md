## Installation

- Copy `backends/ida/graffiti.py` to ida plugins directory (default for MacOS/Linux is `~/.idapro/plugins/`, and for windows is `%APPDATA%\Hex-Rays\IDA Pro\plugins`).
  - Also can clone the repository and add a symlink.
  - For windows users it is recommended to install `pywin32` package for IDAPython

## Usage

- Go to Options->"Graffiti: Connect to server".
- _Ctrl+Shift+A_ - Add node to the graph
- _Ctrl+Shift+X_ - Add node to the graph with text on the edge
- _Ctrl+Alt+A_ - Add line node to the graph
- _Ctrl+Shift+Q_ - Add all of the xrefs of a node to the graph.
- _Ctrl+Shift+Alt+Q_ - Add all of the line xrefs of a node to the graph.

**Note:** A Rename will be reflected in the opened graphs.
