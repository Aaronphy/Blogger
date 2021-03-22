/* eslint-disable no-restricted-globals */
/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Spin } from 'antd';
import Editor from './components/Editor';
import ActionBox from './components/ActionBox';
import LabelManager from './components/LabelManager';
import List from './components/List';
import { WebviewRPC } from 'vscode-webview-rpc';

import { getMilestones } from './service';
import { IStore, IIssue } from './types'
import 'bytemd/dist/index.min.css';
import 'antd/dist/antd.css';
import './App.css';
import { message } from 'antd';


declare var acquireVsCodeApi: any;

let RPC:WebviewRPC;


const vscode = acquireVsCodeApi();

const showError = (res:string)=> {
  message.error(res);
  return Promise.resolve();
}

const showSuccess = (res:string)=> {
  message.success(res);
  return Promise.resolve();
}






const App = observer(() => {

  const store = useLocalObservable<IStore>(()=>({
    labels:[],
    milestones:[],
    issues:[],
    filterLabels:[],
    filterMilestones:[],
    current: {} as IIssue,
    totalCount:1,
    currentPage:1,
    listVisible:false,
    tagsVisible:false,
    loading:false,
    setLoading:(e:boolean)=>{
      store.loading = e;
    },
    setFilterLabels:(e)=>{
      store.filterLabels = e;
    },
    getLabels:async()=>{
        let labels:any
        labels = await RPC.emit("getLabels",[]);
        store.labels = labels||[]
    },
    createLabel:async(e)=>{
        await RPC.emit("createLabel",[e]);
        store.getLabels();
        return Promise.resolve();
    },
    deleteLabel:async(e)=>{
        await RPC.emit("deleteLabel",[e]);
        store.getLabels();
    },
    updateLabel:async(a,b)=>{
        await RPC.emit("updateLabel",[a,b]);
        store.getLabels();
        return Promise.resolve();
    },
    getMilestones:async()=>{
        const milestones = await getMilestones();
        store.milestones = milestones;
    },
    getIssueTotalCount:async()=>{
       let count:any
        if(store.filterLabels.length>0){
          count = await RPC.emit('getFilterCount',[store.filterLabels.map(item=>item.name).join(',')])
        }else {
          count = await RPC.emit('getTotalCount');
        }
        console.log(count);
        store.totalCount = count;
    },
    getIssues:async ()=>{
        let issues:any;
        store.getIssueTotalCount();
        issues = await RPC.emit("getIssues",[store.currentPage,store.filterLabels.map(item=>item.name).join(',')]);
        store.issues = issues ||[];
    },
    setCurrentPage(index:number){
      store.currentPage = index;
      store.getIssues();
    },
    updateTitle:(e)=>{
      store.current.title= e;
    },
    setListVisible:(e)=>{
      store.listVisible = e;
      store.getIssues();
    },
    setTagsVisible:(e)=>{
      store.tagsVisible = e;
    },
    setCurrentIssue:(e)=>{
      store.current = e
    },
    setCurrentIssueBody:(e)=>{
      store.current.body = e;
    },
    addTag:(e)=>{
      if(!store.current.labels)store.current.labels=[];
      store.current.labels = store.current.labels.concat(e);
    },
    removeTag:(e)=>{
      if(!store.current.labels)store.current.labels=[];
      store.current.labels = store.current.labels.filter(item=>item.id!==e.id);
    },
    updateIssue:async ()=>{
      const {number=undefined,title='',body='',labels=[]} = store.current;
      if(!title||!body)return message.error('Please enter the content~');
      if(!number){
        const data = await RPC.emit("createIssue",[title,body,labels]);
        store.current.number = data.number;
      }else {
        await RPC.emit("updateIssue",[number,title,body,JSON.stringify(labels)]);
      }
      return Promise.resolve();
    },
  }));

  React.useEffect(()=>{
    RPC = new WebviewRPC(window, vscode);
    RPC.on('showSuccess',showSuccess);
    RPC.on('showError',showError);
    store.getLabels();
    store.getIssues();
  },[]);


  const checkFile = (file:File)=>{
    const isLt2M = file.size/1024/1024<2;
    if(!isLt2M){
      message.error('Image`s maxsize is 2MB');
    }
    return isLt2M;
  }


  const uploadImages = (e:File[])=>{

    if(e.length===0)return;
    const img = e[0];
    if(!checkFile(img))return;
    const hide = message.loading('Uploading Picture...', 0);
    const ext = img.name.split('.').pop();
    const path = `images/${new Date().getTime()}.${ext}`
    const fileReader =  new FileReader()
    fileReader.readAsDataURL(img);
    return new Promise((resolve,reject)=>{
        fileReader.onloadend = ()=>{
            const content = (fileReader.result as string).split(',')[1];
            RPC.emit("uploadImage",[content,path]).then((res:any)=>{
              hide();
              message.success('Uploaded!');
              resolve(res)
            }).catch((err:any)=>{
              reject(err);
              message.error('Uploading failed')
            })
        }
     })
  }

  return (
    <Spin tip="Syncing..." spinning={store.loading}>
      <div className="app">
          <Editor
              labels={store.current.labels||[]}
              store={store}
              title={store.current.title||''}
              content={store.current.body||''}
              totalLabels={store.labels||[]}
              placeholder="Leave your thought~"
              uploadImages={uploadImages}
          />
          <List
            totalLabels={store.labels}
            labels={store.filterLabels}
            visible={store.listVisible}
            store={store} issues={store.issues}
            totalCount={store.totalCount}
            currentPage={store.currentPage}
          />
          <LabelManager visible={store.tagsVisible} store={store} labels={store.labels}/>
          <ActionBox store={store}/>
      </div>
    </Spin>
  );
});

export default App;