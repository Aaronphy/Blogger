import { Editor,Viewer } from '@bytemd/react';
import { Input, Tag } from 'antd';
import formt from '@bytemd/plugin-frontmatter';
import gfm from '@bytemd/plugin-gfm';
import hl from '@bytemd/plugin-highlight';
import breaks from '@bytemd/plugin-breaks';
import { ILabel, IStore } from '../types';


const plugins = [
  formt(),
breaks(),
  gfm(),
  hl(),
];

const { CheckableTag } = Tag;

export interface IEditorProps {
    value:string,
    setValue:(e:string)=>void,
    placeholder:string,
    uploadImages:(e:File[])=>Promise<any>
}

export interface IViewerProps {
    value:string
}

export function MDEditor ({value,setValue,uploadImages,placeholder}:IEditorProps){
    return (
        <Editor
          value={value}
          plugins={plugins}
          previewDebounce={50}
          placeholder={placeholder}
          onChange={(v) => {
            setValue(v);
          }}
          uploadImages={uploadImages}
        />
    )
}

export function MDViewer({value}:IViewerProps) {
    return (
        <Viewer
          value={value}
        />
    )
}


export interface IContentEditor {
  title:IStore['current']['title'],
  content:IStore['current']['body'],
  totalLabels:ILabel[],
  labels:ILabel[],
  placeholder:string,
  uploadImages:(e:File[])=>Promise<any>,
  store:IStore
}

export default function ContentEditor({title,content,labels,totalLabels,placeholder,uploadImages,store}:IContentEditor) {

  const handleChange=(item:ILabel,checked:boolean)=>{
      if(checked){
        store.addTag(item);
      }else{
        store.removeTag(item);
      }
  }

  return(
    <>
      <div className="app-title">
        <Input
          value={title} 
          onChange={(e)=>store.updateTitle(e.target.value)}
          placeholder="Title"
        />
      </div>
      <div className="app-labels">
         {
           totalLabels.map(item=>(
            <CheckableTag
              key={item.id}
              checked={labels.filter(label=>label.id===item.id).length>0}
              onChange={checked => handleChange(item, checked)}
            >
            {item.name}
           </CheckableTag>
           ))
         }
      </div>
      <Editor
        value={content||''}
        plugins={plugins}
        previewDebounce={50}
        placeholder={placeholder}
        onChange={(v) => {
          store.setCurrentIssueBody(v)
        }}
        uploadImages={uploadImages}
        />
    </>
  );
}