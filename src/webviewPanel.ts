/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import Server from './server';

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,
		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'client')]
	};
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}


const sleep = (ms:number) => new Promise((resolve,reject)=>setTimeout(resolve,ms));

export default class EditPanel {

    public static currentPanel: EditPanel | undefined;

    public static readonly viewType = 'EditPanel';

	public static context:vscode.ExtensionContext;


    private readonly _panel: vscode.WebviewPanel;

	private readonly _extensionUri: vscode.Uri;
	private _server!:Server;
	private _disposables: vscode.Disposable[] = [];

    public static createOrShow(contenxt:vscode.ExtensionContext) {

		const extensionUri = contenxt.extensionUri;

		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (EditPanel.currentPanel) {
			EditPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			EditPanel.viewType,
			'Blog Editing',
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri),
		);

		EditPanel.currentPanel = new EditPanel(panel, extensionUri);
		vscode.commands.executeCommand('workbench.action.closeSidebar');
	}

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		EditPanel.currentPanel = new EditPanel(panel, extensionUri);
	}

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._server = new Server(this._panel.webview);
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Initializing webview...'
		}, async (progress) => {
			progress.report({  increment: 0 });
			try{
				await this._update();
				this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
			}catch(e){
				vscode.window.showErrorMessage('Init WebView failed please try again~');
			}
			progress.report({ increment: 100 });
		});
	}

    public dispose() {
		EditPanel.currentPanel = undefined;
		// Clean up our resources
		this._panel.dispose();
		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

    private async _update() {
		const webview = this._panel.webview;
		this._panel.webview.html = await this._getHtmlForWebview(webview);
		return Promise.resolve();
	}


    private  async _getHtmlForWebview(webview: vscode.Webview) {

		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'client', 'build/js/main.js');
		const scriptExtra = vscode.Uri.joinPath(this._extensionUri, 'client', 'build/js/1.js');
		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
		const scriptExtraUri = webview.asWebviewUri(scriptExtra);

		// Local path to css styles
		const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'client', 'build/css/main.css');

		// Uri to load styles into webview
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();
		const html = `
				<!doctype html>
				<html lang="en">
				<head>
				<meta charset="utf-8"/>
				<meta name="viewport" content="width=device-width,initial-scale=1"/>
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">            <meta name="theme-color" content="#000000"/>
				<meta name="description" content="Web site created using create-react-app"/>
				<title>React App</title>
				<link href="${stylesMainUri}" rel="stylesheet">
				</head>
				<body>
					<noscript>You need to enable JavaScript to run this app.</noscript>
					<div id="root"></div>
					<script  nonce="${nonce}" src="${scriptExtraUri}"></script>
					<script  nonce="${nonce}" src="${scriptUri}"></script>
				</body>
				</html>
			`;
		return html;
	}
}