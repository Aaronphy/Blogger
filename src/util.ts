import * as vscode from 'vscode';


export interface ISetting {
    token:string,
    user:string,
    repo:string,
}


export interface UrlSchema {
  user:string,
  repo:string,
  file:string
}

export async function getSetting():Promise<ISetting>{
    const token = <string>await vscode.workspace.getConfiguration('blogger').get('github.token');
    const user = <string>await vscode.workspace.getConfiguration('blogger').get('github.user');
    const repo = <string>await vscode.workspace.getConfiguration('blogger').get('github.repo');
    return {token,user,repo};
}


export const cdnURL = ({user,repo,file}:UrlSchema) =>`https://cdn.jsdelivr.net/gh/${user}/${repo}/${file}`;


export async function to<T, U = Error> (
    promise: Promise<T>,
    errorExt?: object
  ): Promise<[U | null, T | undefined]> {
    try {
      const data = await promise;
      const result: [null, T] = [null, data];
      console.log('data',data);
      return result;
    } catch (err) {
      console.log('err',err);
      if (errorExt) {
        Object.assign(err, errorExt);
      }
      const resultWithError: [U, undefined] = [err, undefined];
      return resultWithError;
    }
}