## Installation
* Copy `backends/ida/graffiti.py` to ida plugins directory (default for MacOS/Linux is `~/.idapro/plugins/`, and for windows is `%APPDATA%\Hex-Rays\IDA Pro\plugins`).
  * Also can clone the repository and add a symlink.
  * For windows users it is recommended to install `pywin32` package for IDAPython


## Usage
* Go to Options->"Graffiti: Connect to server".
* *Ctrl+Shift+A* - Add node to the graph
* *Ctrl+Shift+X* - Add node to the graph with text on the edge
* *Ctrl+Alt+A* - Add line node to the graph
* *Ctrl+Shift+Q* - Add all of the xrefs of a node to the graph.
* *Ctrl+Shift+Alt+Q* - Add all of the line xrefs of a node to the graph.
  

**Note:** A Rename will be reflected in the opened graphs.