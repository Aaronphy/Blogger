import { uniqueId } from 'lodash';


export interface IPromiseCallbacks {
    resolve: Function;
    reject: Function;
}

export interface IRPC {
    emit(method:string,params?:any):Promise<any>;
    on(name:string,method:Function): void;
    off(name:string): void;
    sendRequest(id:string,method:string,params?:any[]):void;
    sendResponse(id: string, response: any, success?: boolean): void;
    handleResponse(message: any): void;
    handleRequest(message: any): void;
    listLocalMethods(): string[];
    listRemoteMethods(): Promise<string[]>;
}


export abstract class BaseRPC implements IRPC {
    abstract sendRequest(id: string, method: string, params?: any[]): void;
    abstract sendResponse(id: string, response: any, success?: boolean): void;
    protected promiseCallbacks: Map<string, IPromiseCallbacks>; 
    protected methods: Map<string, Function>;
    protected timeout: number = 3600000;

    constructor() {
        this.promiseCallbacks = new Map();
        this.methods = new Map();
    }

    public setResponseTimeout(timeout: number): void {
        this.timeout = timeout;
    }

    public on(name:string,method:Function): void {
        this.methods.set(name, method);
    }

    public off(name:string): void {
        this.methods.delete(name);
    }

    public listLocalMethods(): string[] {
        return Array.from(this.methods.keys());
    }

    public listRemoteMethods(): Promise<string[]> {
        return this.emit("listLocalMethods");
    }

    emit(method: string, params?: any[]): Promise<any> {

        const id = uniqueId();
        const promise = new Promise((resolve, reject) => {
            this.promiseCallbacks.set(id, { resolve: resolve, reject: reject });
        });
        this.sendRequest(id, method, params);
        return promise;
    }

    handleResponse(message:any):void{
        const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(message.id);
        if(promiseCallbacks){
            if (message.success) {
                promiseCallbacks.resolve(message.response);
            } else {
                promiseCallbacks.reject(message.response);
            }
              this.promiseCallbacks.delete(message.id);
        }
    }

    async handleRequest(message:any):Promise<void> {
        const method: Function | undefined = this.methods.get(message.method);
        if(method) {
            const func:Function = method;
            try{
                let response:any = await func(...message.params);
                this.sendResponse(message.id, response,true);
            }catch (err){
                this.sendResponse(message.id, err, false);
            }
        }
    }
}