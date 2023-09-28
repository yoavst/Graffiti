import { SymbolNode, ScopeFinder } from './scope';
import * as vscode from 'vscode';
import { SymbolKind } from 'vscode';
import * as assert from 'assert';
import * as graffiti from './graffiti';
import { TextEncoder } from 'util';
import { debugChannel } from './extension';

interface NavigationItem extends vscode.QuickPickItem {
    node: SymbolNode;
}

export class ScopeSymbolProvider {
    // TODO: cache necessary?
    private _scopeFinder: ScopeFinder;
    private _status: vscode.StatusBarItem;

    private _lastPos: vscode.Position;
    private _cancelToken: vscode.CancellationTokenSource;

    constructor(context: vscode.ExtensionContext) {
        this._status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this._status.tooltip = 'Symbol Navigation';
        this.refreshNavigateCommand();
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('scopebar.Navigate')) {
                this.refreshNavigateCommand();
            }
        }));

        let editor = vscode.window.activeTextEditor;
        if (editor) {
            this._scopeFinder = new ScopeFinder(editor.document);
            this.updateStatus(editor.selection.start);
        }
        vscode.window.onDidChangeTextEditorSelection(async e => {
            if (e.selections.length < 1) {
                return;
            }
            let selection = e.selections[0];
            this.updateStatus(selection.start);
        });

        vscode.window.onDidChangeActiveTextEditor(e => {
            if (!e) {
                this.updateStatus();
                return;
            }
            this._lastPos = null;
            this._scopeFinder = new ScopeFinder(e.document);
            this.updateStatus(e.selection.start);
        });

        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.isDirty) {
                return;
            }
            if (this._scopeFinder && e.document === this._scopeFinder.document) {
                this._scopeFinder.update();
                return;
            }
            this._scopeFinder = new ScopeFinder(e.document);
        });

        let command = this._status.command ?? ""
        let strCommand = typeof command == "string" ? command : command.command;

        vscode.commands.registerCommand(strCommand, async () => {
            let selection = vscode.window.activeTextEditor.selection;
            let node = await this._scopeFinder.getScopeNode(selection.start);
            this.showScopeSymbols(node);
        });

        vscode.commands.registerCommand("graffiti.AddToGraphWithEdgeInfo", async () => {
            let selection = vscode.window.activeTextEditor.selection;
            let node = await this._scopeFinder.getScopeNode(selection.start);

            const edgeText = await vscode.window.showInputBox({
                prompt: 'Enter edge text',
                placeHolder: 'Edge text'
            })

            if (!edgeText) return

            debugChannel.appendLine(`Graffiti.AddToGraphWithEdgeInfo(): ${node}`)
            debugChannel.appendLine(`edge text: \'${edgeText}\'`)


            if (node != null) {
                let hovers = await this._scopeFinder.getHover(selection.anchor);
                let hover = ((hovers[0]?.contents) as vscode.MarkdownString[])?.map(it => it.value)

                const update = graffiti.createUpdate(this._scopeFinder.document, node, { edgeText, hover })
                if (update != null)
                    await graffiti.sendUpdate(update)
            }
        });

        vscode.commands.registerCommand("graffiti.AddToGraph", async () => {
            let selection = vscode.window.activeTextEditor.selection;
            let node = await this._scopeFinder.getScopeNode(selection.start);
            debugChannel.appendLine(`Graffiti.AddToGraph(): ${node}`)
            debugChannel.appendLine(this._scopeFinder.document.languageId);
            if (node != null) {
                let hovers = await this._scopeFinder.getHover(selection.anchor);
                let hover = ((hovers[0]?.contents) as vscode.MarkdownString[])?.map(it => it.value)

                const update = graffiti.createUpdate(this._scopeFinder.document, node, { hover })
                if (update != null)
                    await graffiti.sendUpdate(update)
            }
        });

        vscode.commands.registerCommand("graffiti.AddLineToGraph", async () => {
            // FIXME
            let selection = vscode.window.activeTextEditor.selection;
            let node = await this._scopeFinder.getScopeNode(selection.start);
            let currentLine = selection.start.line
            debugChannel.appendLine(`Graffiti.AddLineToGraph(): ${node}`)
            if (node != null) {
                const update = graffiti.createUpdate(this._scopeFinder.document, node, { lineNumber: currentLine })
                if (update != null)
                    await graffiti.sendUpdate(update)
            }
        });

        vscode.commands.registerCommand("graffiti.ConnectToServer", async () => {
            const address = await vscode.window.showInputBox({
                prompt: 'Enter server address',
                value: "localhost:8501"
            })

            if (!address) return

            const split = address.split(":")
            if (split.length != 2) return
            const [hostname, port] = split

            graffiti.connectServer(hostname, parseInt(port))
        });

        vscode.commands.registerCommand("graffiti.ConvertToSymbolBased", async () => {
            const options: vscode.OpenDialogOptions = {
                canSelectMany: false,
                openLabel: 'Choose graffiti file',
                filters: {
                    'json files': ['json'],
                    'All files': ['*']
                }
            };

            const fileUri = await vscode.window.showOpenDialog(options)
            if (fileUri && fileUri[0]) {
                const doc = await vscode.workspace.openTextDocument(fileUri[0])
                const text = doc.getText()
                let graffitiObj = null
                try {
                    graffitiObj = JSON.parse(text)
                } catch (e) {
                    await vscode.window.showErrorMessage(`Graffiti: failed to read graffiti file: ${e.message}`)
                    return
                }

                if (await graffiti.updateSymbolsForGraffiti(graffitiObj)) {
                    await vscode.workspace.fs.writeFile(vscode.Uri.parse(fileUri[0].path + ".new"),
                        new TextEncoder().encode(JSON.stringify(graffitiObj, null, 4)))
                    await vscode.window.showInformationMessage(`Graffiti: Converted the file successfully`)
                }
            }
        })
    }

    private refreshNavigateCommand() {
        const config = vscode.workspace.getConfiguration('scopebar');
        let command: string;
        switch (config['Navigate']) {
            case 'FileSymbol':
                command = 'workbench.action.gotoSymbol';
                break;
            default:
                command = 'scopebar.ShowScopeSymbols'
                break;
        }
        this._status.command = command;
    }

    private updateStatus(pos?: vscode.Position, delay?: number) {
        if (this._cancelToken) {
            this._cancelToken.cancel();
        }
        this._cancelToken = new vscode.CancellationTokenSource();
        setTimeout(async (token: vscode.CancellationToken) => {
            if (token.isCancellationRequested) {
                return;
            }
            if (!pos) {
                this._status.hide();
                return;
            }
            if (this._lastPos == pos) {
                return;
            }
            let node: SymbolNode;
            try {
                node = await this._scopeFinder.getScopeNode(pos);
            } catch (err) {
                if (err.name == 'CancelUpdateError') {
                    return;
                }
                throw err;
            }
            if (!node) {
                // The updateNode call may reject by timeout, use an empyty node for now
                // and refresh the status next time
                node = this._scopeFinder.dummyNode;
                this.updateStatus(pos, 1000);
            }
            this._status.text = node.getFullName();
            this._status.show();

        }, delay ? delay : 32, this._cancelToken.token);
    }

    private onSelectNavigationItem(item: NavigationItem) {
        if (!item) {
            return;
        }
        let node = item.node;
        vscode.window.activeTextEditor.revealRange(
            node.range, vscode.TextEditorRevealType.Default);

        let pos = node.range.start;
        let newSelection = new vscode.Selection(pos, pos);
        vscode.window.activeTextEditor.selection = newSelection;
    }

    private findScopeParent(node: SymbolNode): SymbolNode {
        const ShowType = [
            SymbolKind.Class,
            SymbolKind.Namespace,
            SymbolKind.Module
        ]
        if (!node) {
            return null;
        }
        if (!node.symbolInfo || ShowType.indexOf(node.symbolInfo.kind) != -1) {
            return node;
        }
        return this.findScopeParent(node.parent);
    }

    private async showScopeSymbols(node: SymbolNode) {
        if (!node) {
            return;
        }
        let parent = this.findScopeParent(node);
        if (!parent) {
            return;
        }
        let parentName = parent.getFullName();
        let items = parent.children.map(subNode => {
            assert(subNode.symbolInfo);
            // TODO: find a way for showing custom icon
            let item = <NavigationItem>{
                label: '$(tag)  ' + subNode.symbolInfo.name,
                description: parentName,
                node: subNode
            };
            return item;
        });

        let oldRanges = vscode.window.activeTextEditor.visibleRanges;
        let oldSelections = vscode.window.activeTextEditor.selections;

        let target = await vscode.window.showQuickPick(items, {
            placeHolder: parent.getFullName(),
            canPickMany: false,
            onDidSelectItem: this.onSelectNavigationItem.bind(this)
        });

        if (!target) {
            // Didn't select any one, recover the position
            vscode.window.activeTextEditor.revealRange(oldRanges[0]);
            vscode.window.activeTextEditor.selections = oldSelections;
            return;
        }
        this.onSelectNavigationItem(target);
    }
}
