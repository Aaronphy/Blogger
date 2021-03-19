// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import EditPanel,{getWebviewOptions}from './webviewPanel';
import { multiStepInput } from './multiSelectInput';

async function noConfigCheck() {
	const token = await vscode.workspace.getConfiguration('blogger').get('github.token');
 	const user = await vscode.workspace.getConfiguration('blogger').get('github.user');
	const repo = await vscode.workspace.getConfiguration('blogger').get('github.repo');
	return Promise.resolve(!token || !user || !repo );
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableA = vscode.commands.registerCommand('blogger.open', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const needConfig = await noConfigCheck();
		if(needConfig){
			return multiStepInput(context);
		}
		EditPanel.createOrShow(context);
	});

	let disposableB = vscode.commands.registerCommand('blogger.config',()=>{
		multiStepInput(context);
	});


	context.subscriptions.push(disposableA,disposableB);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(EditPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				EditPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

export function deactivate() {}
