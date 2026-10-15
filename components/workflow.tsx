import {workflow} from '@/app/app/workflow-actions';
export function Action({op,children}:{op:string;children:React.ReactNode}){return <form action={workflow} className="form-stack"><input type="hidden" name="op" value={op}/>{children}</form>}
export function Id({id}:{id:string}){return <input type="hidden" name="id" value={id}/>}
export { ToastNotice as Notice } from './toast-notice';
export function Empty({children}:{children:React.ReactNode}){return <div className="panel"><p>{children}</p></div>}
export {Submit} from './workflow-submit';
