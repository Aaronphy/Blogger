import { Octokit } from '@octokit/core';
import { IGQL } from './types';
import { cdnURL,to } from './utils';
import { message } from 'antd';


/**
 * 全局获取配置信息
 * token： GitHub token
 * user: 用户名
 * repo: 开启issues博客的仓库名
 */
const {
    token="",
    user="Aaronphy",
    repo="aaronphy.github.io",

} = (window as any).g_config||{};


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
}


const octokit = new Octokit({
    auth:token
})

octokit.hook.after("request", async (response, options) => {
    if(options.url.includes("/graphql"))return;
    if(options.method ==='DELETE') return message.success('Removed Successfully');
    if(options.method ==='POST') return message.success('Created Successfully');
    if(options.method === 'PATCH') return message.success('Updated Successfully')
});

octokit.hook.error("request", async (error, options) => {
   //message.error(JSON.stringify(error),500000000);
});

/**
 * 上传图片至图床仓库
 * @param content
 * @param path
 */
export const uploadImage = async (content:string,path:string) =>{
    return  await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner: user,
            repo: repo,
            path: path,
            message: 'upload images',
            content: content,
    })
}

/**
 * 获取labels /标签
 */
export const getLabels = async () => {
    const [err,res] = await to(octokit.request('GET /repos/{owner}/{repo}/labels', {
        owner: user,
        repo: repo
    }));
    if(!err)return res?.data;
    return [];
}

/**
 * 获取 milestone / 分类
 */
export const getMilestones = async ()=>{
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/milestones', {
        owner: user,
        repo: repo
    });
    return data;
}


/**
 * 获取仓库issue数的总数
 * @param page
 * @param labels
 * @param milestone
 */

export const getIssues = async(page:number,labels?:string,milestone?:string)=>{
   const [err,res] = await to(octokit.request('GET /repos/{owner}/{repo}/issues', {
        owner: user,
        repo: repo,
        page,
        labels,
        per_page:10,
        milestone
   }))
  if(!err)return res?.data;
}


/**
 * 获取筛选后的issues总数
 * @param param0
 */
export const queryFilterIssueCount = ({ label, milestone }:IGQL) =>
  octokit.graphql(documents.getFilterIssueCount({ username:user, repository:repo, label, milestone }));

/**
  * 获取仓库issues总数
*/
export const queryIssueTotalCount = () =>octokit.graphql(documents.getIssueCount({ username:user, repository:repo}));


/**
 * 提供给Markdown编辑器的图片上传接口
 * @param
 */
export const uploadImages = (e:File[])=>{
  const hide = message.loading('Uploading Picture...', 0);
  const img = e[0];
  const ext = img.name.split('.').pop();
  const path = `${new Date().getTime()}.${ext}`
  const fileReader =  new FileReader()
  fileReader.readAsDataURL(img);
  return new Promise((resolve,reject)=>{
      fileReader.onloadend = ()=>{
          const content = (fileReader.result as string).split(',')[1];
          uploadImage(content,path).then(res=>{
            hide();
            message.success('Uploaded!')
            resolve([{
              url:cdnURL({user,repo,file:path})
            }])
          }).catch(err=>{
              reject();
              message.error('Uploading failed')
          });
      }
   })
}

/**
 * 创建标签
 * @param name
 * @returns
 */
export const createLabel = async(name:string)=>{
  const [err,res] = await to(octokit.request('POST /repos/{owner}/{repo}/labels', {
       owner: user,
       repo: repo,
       name
  }));
  if(!err)return res?.data;
}


/**
 * 删除标签
 * @param name
 * @returns
 */
export const deleteLabel = async(name:string)=>{
  const { data } = await octokit.request('DELETE /repos/{owner}/{repo}/labels/{name}', {
       owner: user,
       repo: repo,
       name
  })
   return data;
}

/**
 * 更新标签
 * @param name 
 * @param new_name 
 * @returns 
 */
export const updateLabel = async(name:string,new_name:string)=>{
  const { data } = await octokit.request('PATCH /repos/{owner}/{repo}/labels/{name}', {
       owner: user,
       repo: repo,
       name,
       new_name
  })
   return data;
}

/**
 * 创建issue
 * @param title 
 * @param body 
 * @param labels 
 * @returns 
 */
export const createIssue = async(title:string,body:string,labels:any[])=>{
  const { data } = await octokit.request('POST /repos/{owner}/{repo}/issues', {
       owner: user,
       repo: repo,
       title,
       body,
       labels
  })
   return data;
}

export const updateIssue = async(issue_number:number,title:string,body:string,labels:any[])=>{
  const { data } = await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
       owner: user,
       repo: repo,
       issue_number,
       title,
       body,
       labels
  })
   return data;
}