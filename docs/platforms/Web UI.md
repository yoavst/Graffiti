Right click the button on the top right of the screen to connect to the local python server
## The basics
* Graffiti shows graph of methods/fields/lines you choose to add.
* When you add a node from the IDE, it will be linked to the currently selected element.
* The new node will be automatically selected, unless the setting changed
* Clicking a node will select it
* Right clicking a node will open it in the editor (as long it is connected)
* You can use `Ctrl+Z` and `Ctrl+Shift+Z` to undo/redo your actions
* Use `Ctrl+S` to save your graph to file. You can import it by dragging it to the screen.
* Use Ctrl+Shift+P to open the command palette for shortcuts and new actions
## Advance features
* You can add text nodes (`Ctrl+Shift+Q`) or comment nodes (`Ctrl+Q`)
* Click the share button to export the graph to image or svg
* To rename or remove a graph, right click the tab's name.
* A list of the linked projects is also available under the tab
* When node is selected, use 1-9 to theme it.
* Use `Home` to center the currently selected node
* Use `Escape` to unselect the current node.
* Use `Ctrl+f` or `Ctrl+Shift+f` to search a node
* Middle clicking a node will swap a node with the selected node (same parent). ctrl for same son, shift for id swap
* You can drag and drop tabs to reorder them
## Deploy
* If you want to locally deploy, download the WEB UI zip, and put all the other downloads (including itself) inside the `out/` folder
* Then serve it using http server (as feature like docs wouldn't work from direct file access)