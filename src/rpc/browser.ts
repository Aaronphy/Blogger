/// <reference path="../../node_modules/typescript/lib/lib.dom.d.ts"/>
import { BaseRPC, IPromiseCallbacks } from './base';
import { Webview } from 'vscode';

export default class WebviewRPC extends BaseRPC {
    window: Window;
    vscode: Webview;

    constructor(window:Window,vscode:Webview){
        super();
        this.window = window;
        this.vscode = vscode;
        this._init();
    }

    private _init(){
        this.window.addEventListener("message", (event) => {
            const message = event.data;
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

    sendRequest(id:string,method:string,params?:any[]){
        setTimeout(() => {
            const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
            if (promiseCallbacks) {
              promiseCallbacks.reject("Request timed out");
              this.promiseCallbacks.delete(id);
            }
          }, this.timeout);

        this.vscode.postMessage({
            type: "request",
            id: id,
            method: method,
            params: params
        });
    }

    sendResponse(id: string, response: any, success: boolean = true): void {
        this.vscode.postMessage({
          type: "response",
          id: id,
          response: response,
          success: success
        });
    }

}