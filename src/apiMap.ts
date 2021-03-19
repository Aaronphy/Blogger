// eslint-disable-next-line @typescript-eslint/naming-convention
const ApiMap ={
    getLabels:'GET /repos/{owner}/{repo}/labels',
    createLabel:'POST /repos/{owner}/{repo}/labels',
    deleteLabel:'DELETE /repos/{owner}/{repo}/labels/{name}',
    updateLabel:'PATCH /repos/{owner}/{repo}/labels/{name}',
    getIssues:'GET /repos/{owner}/{repo}/issues',
    createIssue:'POST /repos/{owner}/{repo}/issues',
    updateIssue:'PATCH /repos/{owner}/{repo}/issues/{issue_number}',
    uploadImage:'PUT /repos/{owner}/{repo}/contents/{path}'
};


export default ApiMap;