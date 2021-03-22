import { Drawer, Select, Empty, Pagination } from 'antd';
import { IIssue, IStore, ILabel } from '../types';


export interface IList {
    store:IStore,
    visible:boolean,
    totalLabels:ILabel[],
    labels:ILabel[],
    issues:IIssue[],
    totalCount:number,
    currentPage:number
}

export default function List ({store,visible,totalLabels,labels,totalCount,currentPage}:IList) {

    const selectedOptions = labels.map(item=>item.name);

    const handleChange=(e:string[]=[])=>{
      store.setFilterLabels(totalLabels.filter(o=> e.includes(o.name)));
      store.getIssues();
    }

    return (
        <Drawer
          title="Blog List"
          placement="left"
          closable={false}
          onClose={()=>store.setListVisible(false)}
          visible={visible}
        >
          <div className="app-bloglist">
            <div className="blog-filter">
              <Select
                  placeholder="Filter by tags"
                  value={selectedOptions}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                  allowClear
                  onClear={()=>{
                    store.setFilterLabels([]);
                    store.getIssues()
                  }}
                  onBlur={()=>store.getIssues()}
                >
                {totalLabels.map(item => (
                  <Select.Option key={item.id} value={item.name}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className="list">
              {
              store.issues.length>0?
              store.issues.map((item)=>(<div key={item.id} className="app-bloglist-item" onClick={()=>{
                store.setListVisible(false);
                store.setCurrentIssue(item);
              }}>{item.title}</div>)): <Empty></Empty>
             }
            </div>
            <div className="blog-pagination">
              {
                totalCount>20?
                <Pagination size="small" total={totalCount} pageSize={20} current={currentPage} onChange={(e)=>store.setCurrentPage(e)}/>:null
              }
            </div>
          </div>
        </Drawer>
    )
};