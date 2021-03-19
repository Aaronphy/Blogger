import * as React from 'react';
import { Drawer,Input, Tooltip, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ILabel, IStore } from '../types';


export interface ITagsMg {
    store:IStore,
    visible:boolean,
    labels:ILabel[]
}

export default function TagsManager({store,visible,labels}:ITagsMg) {

    const [text,setText] = React.useState<string>('');
    const [editValue,setEditValue] = React.useState<string>('');
    const [editIndex,setEditIndex] = React.useState<number>();
    const saveEditInputRef = React.useRef<Input>(null);
    const saveInputRef = React.useRef<Input>(null);
    const [inputVisible,setInputVisible] = React.useState(false);

    const handleEditInputConfirm = async (tag:ILabel)=>{
        if(checkDuplicate(editValue)||checkEmpty(editValue))return reset();
        await store.updateLabel(tag.name,editValue);
        reset();
    }

    const handleClose = (tag:ILabel) =>{
        store.deleteLabel(tag.name);
    }

    const handleInputConfirm = async ()=>{
        if(checkDuplicate(text))return message.error(`Tag: "${text}" already exists!`);
        if(checkEmpty(text))return reset();
        await store.createLabel(text);
        reset();
    }

    const reset = ()=>{
        setInputVisible(false);
        setEditIndex(undefined);
        setEditValue('');
        setText('');
    }

    const checkDuplicate = (name:string)=>{
        return labels.filter(item=>item.name===name).length>0
    }

    const checkEmpty = (name:string)=>{
        return name.trim() === '';
    }

    return (
        <Drawer
            title="Tags Management"
            visible={visible}
            closable={false}
            onClose={()=>store.setTagsVisible(false)}
            placement="right"
        >
          <>
            {
                labels.map((label)=>{
                    if(label.id===editIndex){
                        return(
                            <Input
                                ref={saveEditInputRef}
                                key={label.id}
                                size="small"
                                className="tag-input"
                                value={editValue}
                                onChange={(e)=>setEditValue(e.target.value)}
                                onBlur={()=>handleEditInputConfirm(label)}
                                onPressEnter={()=>handleEditInputConfirm(label)}
                            />
                        )
                    }
                    const isLongTag = label.name.length > 20;
                    const tagElem = (
                        <Tag
                          className="edit-tag"
                          key={label.name}
                          closable={true}
                          color="#1890ff"
                          onClose={()=>handleClose(label)}
                        >
                          <span
                            onDoubleClick={e => {
                              setEditIndex(label.id);
                              setEditValue(label.name);
                              setTimeout(()=>{
                                saveEditInputRef.current?.focus()
                              },0)
                              e.preventDefault();
                            }}
                          >
                            {isLongTag ? `${label.name.slice(0, 20)}...` : label.name}
                          </span>
                        </Tag>
                      );
                      return isLongTag ? (
                        <Tooltip title={label} key={label.id}>
                          {tagElem}
                        </Tooltip>
                      ) : (
                        tagElem
                      );
                })}
                 {inputVisible && (
                    <Input
                        ref={saveInputRef}
                        type="text"
                        size="small"
                        className="tag-input"
                        value={text}
                        onChange={(e)=>setText(e.target.value)}
                        onBlur={handleInputConfirm}
                        onPressEnter={handleInputConfirm}
                    />
                    )}
                    {!inputVisible && (
                    <Tag className="site-tag-plus" onClick={()=>{
                        setInputVisible(true);
                        setTimeout(()=>{
                            saveInputRef.current?.focus()
                        },0)
                    }}>
                        <PlusOutlined /> New Tag
                    </Tag>
                )}
          </>
        </Drawer>
    )
}