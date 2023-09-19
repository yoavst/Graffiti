'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as extensionImpl from './extensionImpl';
import { disconnectServer } from './graffiti';

export let debugChannel: vscode.OutputChannel

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    debugChannel = vscode.window.createOutputChannel("Graffiti")

    debugChannel.appendLine("Graffiti is now activated!")

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let scopeProvider = new extensionImpl.ScopeSymbolProvider(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
    disconnectServer()
}