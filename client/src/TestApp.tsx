import React from 'react';
import {  Button  } from 'antd';
import WebRPC from '../../src/rpc/webview';

declare var acquireVsCodeApi: any;

const vscode = acquireVsCodeApi();

let rpc:WebRPC;

export default function () {

    const click = ()=>{
        rpc.emit('showMessage',['哈哈']);
    }

    React.useEffect(()=>{
        rpc = new WebRPC(window,vscode);
    },[])

    return (
        <Button type="primary" onClick={click}>点击我</Button>
    )
}