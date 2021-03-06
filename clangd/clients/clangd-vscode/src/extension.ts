import * as vscode from 'vscode';
import * as vscodelc from 'vscode-languageclient';

/**
 * Method to get workspace configuration option
 * @param option name of the option (e.g. for clangd.path should be path)
 * @param defaultValue default value to return if option is not set
 */
function getConfig<T>(option: string, defaultValue?: any) : T {
    const config = vscode.workspace.getConfiguration('clangd');
    return config.get<T>(option, defaultValue);
}

/**
 *  this method is called when your extension is activate
 *  your extension is activated the very first time the command is executed
 */
export function activate(context: vscode.ExtensionContext) {
    const clangdPath = getConfig<string>('path');
    const clangdArgs = getConfig<string[]>('arguments');

    const serverOptions: vscodelc.ServerOptions = { command: clangdPath, args: clangdArgs };

    const clientOptions: vscodelc.LanguageClientOptions = {
        // Register the server for C/C++ files
        documentSelector: ['c', 'cc', 'cpp', 'h', 'hh', 'hpp']
    };

    const clangdClient = new vscodelc.LanguageClient('Clang Language Server', serverOptions, clientOptions);

    function applyTextEdits(uri: string, edits: vscodelc.TextEdit[]) {
        let textEditor = vscode.window.activeTextEditor;

        if (textEditor && textEditor.document.uri.toString() === uri) {
            textEditor.edit(mutator => {
                for (const edit of edits) {
                    mutator.replace(vscodelc.Protocol2Code.asRange(edit.range), edit.newText);
                }
            }).then((success) => {
                if (!success) {
                    vscode.window.showErrorMessage('Failed to apply fixes to the document.');
                }
            });
        }
    }

    console.log('Clang Language Server is now active!');

    const disposable = clangdClient.start();

    context.subscriptions.push(disposable, vscode.commands.registerCommand('clangd.applyFix', applyTextEdits));
}
