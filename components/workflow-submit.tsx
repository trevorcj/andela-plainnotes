'use client';
import {useFormStatus} from 'react-dom';
export function Submit({children}:{children:React.ReactNode}){const {pending}=useFormStatus();return <button className="btn btn-primary" disabled={pending} aria-disabled={pending}>{pending?'Saving…':children}</button>}
