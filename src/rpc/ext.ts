import * as vscode from 'vscode';
import {BaseRPC,IPromiseCallbacks} from './base';

export default  class ExtensionRPC extends BaseRPC {
    webview: vscode.Webview;

    constructor(webview:vscode.Webview){
        super();
        this.webview = webview;
        this._init();
    }

    private _init(){
        this.webview.onDidReceiveMessage(message => {
            console.log(message);
            switch (message.type) {
            case "response":
              this.handleResponse(message);
              break;
            case "request":
              this.handleRequest(message);
              break;
            }
        });
    }

    sendRequest(id:string,method:string,params:any[]){
        setTimeout(() => {
            const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
            if (promiseCallbacks) {
              promiseCallbacks.reject("Request timed out");
              this.promiseCallbacks.delete(id);
            }
          }, this.timeout);

          this.webview.postMessage({
              type:'request',
              id:id,
              method,
              params:params
          });
    }

    sendResponse(id: string, response: any, success: boolean = true): void {
        this.webview.postMessage({
          type: "response",
          id: id,
          response: response,
          success: success
        });
    }
}