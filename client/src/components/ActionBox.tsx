import * as React from 'react';
import { Button, Tooltip} from 'antd';
import {IStore} from '../types'
import { MenuUnfoldOutlined, PlusOutlined, SendOutlined, SettingOutlined, TagsOutlined } from '@ant-design/icons';


export interface IActionBox {
  store:IStore
}

export default function ActionBox({store}:IActionBox){
    return (
        <div className="app-actionBox">
              <Tooltip title="New Blog" placement="left">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<PlusOutlined />}
                  onClick={()=>store.setCurrentIssue({} as IStore['current'])}
                />
              </Tooltip>
              <Tooltip title="Tags" placement="left">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<TagsOutlined />}
                  onClick={()=>store.setTagsVisible(true)}
                />
              </Tooltip>
              <Tooltip title="Update" placement="left">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SendOutlined />}
                  onClick={()=>store.updateIssue()}
                />
              </Tooltip>
              <Tooltip title="Blog List" placement="left">
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<MenuUnfoldOutlined />} 
                    onClick={()=>store.setListVisible(true)}
                  />
              </Tooltip>
              {/* <Tooltip title="Settings" placement="left">
                <Button
                  type="primary"
                  shape="circle"
                  icon={ <SettingOutlined/>}
                  onClick={()=>{}}
                />
              </Tooltip> */}
        </div>
    )
}