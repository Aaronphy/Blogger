import { components } from '@octokit/openapi-types/dist-types/generated/types';


export interface IGQL{
    username?:string,
    repository?:string,
    label?:string,
    milestone?:string
}

export interface ILabel{
    id: number;
    node_id: string;
    url: string;
    name: string;
    description: string | null;
    color: string;
    default: boolean;
}

export type IMilestone = components["schemas"]["milestone"];

export type IIssue = components["schemas"]["issue-simple"];

export interface IStore {
    labels:ILabel[],
    milestones:IMilestone[],
    totalCount:number,
    currentPage:number, 
    issues:IIssue[],
    filterLabels:ILabel[],
    filterMilestones:number[],
    current:IIssue,
    listVisible:boolean,
    tagsVisible:boolean,
    setCurrentPage:(e:number)=>void,
    setFilterLabels:(e:ILabel[])=>void,
    getLabels:()=>Promise<any>,
    deleteLabel:(e:string)=>Promise<any>,
    createLabel:(e:string)=>Promise<any>,
    updateLabel:(a:string,b:string)=>Promise<any>
    getMilestones:()=>Promise<any>,
    getIssueTotalCount:()=>Promise<any>,
    getIssues:()=>Promise<any>,
    updateTitle:(e:string)=>void,
    setListVisible:(e:boolean)=>void,
    setTagsVisible:(e:boolean)=>void,
    setCurrentIssue:(e:IIssue)=>void,
    setCurrentIssueBody:(e:string)=>void,
    addTag:(e:ILabel) => void,
    removeTag:(e:ILabel) => void,
    updateIssue:()=>Promise<any>
    [key:string]:any
}



