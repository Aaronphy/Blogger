/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable curly */
import * as vscode from 'vscode';
import { Octokit } from '@octokit/core';
import { RequestParameters } from '@octokit/types';
import { getSetting,ISetting,to, cdnURL} from './util';
import { ExtensionRPC } from 'vscode-webview-rpc';
import ApiMap from './apiMap';


export interface IGQL{
    username?:string,
    repository?:string,
    label?:string,
    milestone?:string
}

/**
 * 构建GraphQL
 */
 const documents =  {
    /**
     * 获取issues总数
     * @param param0
     */
    getIssueCount: ({ username, repository }:IGQL) => `
      query {
        repository(owner:"${username}", name: "${repository}") {
          issues(states:OPEN) {
            totalCount
          }
        }
      }
    `,
    /**
     * 过滤器来获取issue数量
     * @param param0
     */
    getFilterIssueCount: ({ username, repository, label, milestone }:IGQL) => `
      {
        search(type:ISSUE, query: "
          user:${username}
          repo:${repository}
          state:open
          ${milestone ? 'milestone:' + milestone : ''}
          ${label ? 'label:' + label : ''}
        ") {
          issueCount
        }
      }
    `,
};




export default class Service {

    config:ISetting;

    octokit:Octokit;

    webview:vscode.Webview;

    rpc:ExtensionRPC;

    constructor(webview:vscode.Webview){
        this.config = {} as ISetting;
        this.webview = webview;
        this.octokit = null as unknown as Octokit;
        this.rpc = new ExtensionRPC(this.webview);
        this.init();
    }

    /**
     * 初始化octokit
     */
    async init(){
        this.config = await getSetting();
        this.octokit = new Octokit({
            auth:this.config.token,
        });
        this._registerMethod();
        this.octokit.hook.after("request", async (response, options) => {
          if(options.url.includes("/graphql"))return;
          if(options.method ==='DELETE') return await this.rpc.emit("showSuccess",['Removed Successfully']);
          if(options.method ==='POST') return  await this.rpc.emit("showSuccess",['Created Successfully']);
          if(options.method === 'PATCH') return await this.rpc.emit("showSuccess",['Updated Successfully']);
        });
        this.octokit.hook.error("request", async (error, options) => {
          this.rpc.emit("showError",[JSON.stringify(error)]);
       });
    }

    async getLabels(params?:RequestParameters){
      const [err,res] = await to(this.octokit.request(ApiMap['getLabels'],{
        owner:this.config.user,
        repo:this.config.repo,
        ...params
      }));
      if(!err){
        return res?.data || [];
      }
      return [];
    }

    async createLabel (params?:RequestParameters){
        const [err,res] = await to(this.octokit.request(ApiMap['createLabel'],{
          owner:this.config.user,
          repo:this.config.repo,
          ...params
        }));
        console.log(err);
        if(!err){
          return res?.data || {};
        }
        return [];
    }

    async deleteLabel (params?:RequestParameters){
        const [err,res] = await to(this.octokit.request(ApiMap['deleteLabel'],{
          owner:this.config.user,
          repo:this.config.repo,
          ...params
        }));
        if(!err){
          return res?.data;
        }
        return [];
    }

    async updateLabel (params?:RequestParameters){
        const [err,res] = await to(this.octokit.request(ApiMap['updateLabel'],{
          owner:this.config.user,
          repo:this.config.repo,
          ...params
        }));
        if(!err){
          return res?.data;
        }
        return [];
    }


    async getIssues(params?:RequestParameters){
      const [err,res] = await to(this.octokit.request(ApiMap['getIssues'],{
        owner:this.config.user,
        repo:this.config.repo,
        ...params,
        per_page:20,
      }));
      if(!err){
        return res?.data;
      }
      return [];
    }

    async updateIssue(params?:RequestParameters){
        const [err,res] = await to(this.octokit.request(ApiMap['updateIssue'],{
          owner:this.config.user,
          repo:this.config.repo,
          ...params
        }));
        if(!err){
          return res?.data;
        }
        return [];
    }

    async createIssue(params?:RequestParameters){
        const [err,res] = await to(this.octokit.request(ApiMap['createIssue'],{
          owner:this.config.user,
          repo:this.config.repo,
          ...params
        }));
        if(!err){
          return res?.data;
        }
        return [];
    }

    async uploadImage(params:RequestParameters){
      const [err,res] = await to(this.octokit.request(ApiMap['uploadImage'],{
        owner:this.config.user,
        repo:this.config.repo,
        message: 'upload images',
        ...params
      }));
      if(!err){
        return [{
          url:cdnURL({
            user:this.config.user,
            repo:this.config.repo,
            file:<string>params.path
          })
        }];
      }
      return [];
   }

   async queryFilterIssueCount(label:string){
    const [err,res] = await to(this.octokit.graphql(documents.getFilterIssueCount({ username:this.config.user, repository:this.config.repo, label, milestone:undefined })));
    if(!err){
      const {search:{issueCount} } = res as any;
      return issueCount;
    }
    return 1;
   }

   async queryTotalCount(){
    const [err,res] = await to(this.octokit.graphql(documents.getIssueCount({ username:this.config.user, repository:this.config.repo})));
    console.log('total',res);
    if(!err){
      const {repository:{issues:{totalCount}} } = res as any;
      return totalCount;
    }
    return 1;
   }


   	/**
	 * 注册事件
	 */
	private async _registerMethod(){

		const getLabels = async ()=> {
			const data = await this.getLabels();
			return data;
		};
		const getIssues = async (page:string,labels:string)=> {
			return await this.getIssues({page,labels});
		};
		const createLabel = async (name:string)=>{
			return await this.createLabel({name});
		};
		const deleteLabel = async (name:string)=>{
			return await this.deleteLabel({name});
		};
		const updateLabel = async (name:string,new_name:string)=>{
			return await this.updateLabel({name,new_name});
		};

		const createIssue = async (title:string,body:string,labels:any[])=>{
			return await this.createIssue({title,body,labels});
		};

		const updateIssue = async (issue_number:number,title:string,body:string,labels:string)=>{
			return await this.updateIssue({issue_number,title,body,labels:JSON.parse(labels)});
		};

		const uploadImage = async (content:string,path:string)=> {
			return await this.uploadImage({content,path});
		};

		const getTotalCount = async ()=> {
			return await this.queryTotalCount();
		};

		const getFilterCount = async (label:string)=> {
			return await this.queryFilterIssueCount(label);
		};

		this.rpc.on('getLabels',getLabels);
    this.rpc.on('deleteLabel',deleteLabel);
		this.rpc.on('createLabel',createLabel);
		this.rpc.on('updateLabel',updateLabel);
		this.rpc.on('getIssues',getIssues);
		this.rpc.on('updateIssue',updateIssue);
		this.rpc.on('createIssue',createIssue);
		this.rpc.on('uploadImage',uploadImage);
		this.rpc.on('getFilterCount',getFilterCount);
    this.rpc.on('getTotalCount',getTotalCount);
	}


}

