'use server';
import {requireUser} from '@/lib/auth';import {redirect} from 'next/navigation';import {revalidatePath} from 'next/cache';import {z} from 'zod';import {attachGoogleMeetToSession} from '@/lib/google-meet';
const uuid=z.string().uuid();const text=(f:FormData,k:string)=>String(f.get(k)||'');
export async function workflow(f:FormData){const {client,user}=await requireUser();const op=text(f,'op');let path='/app';let error:string|undefined;let message='Saved.';try{let result;
switch(op){
case 'task':path='/app/plan';result=await client.from('plan_tasks').insert({user_id:user.id,title:z.string().trim().min(2).max(200).parse(text(f,'title')),notes:text(f,'notes').slice(0,3000),due_at:text(f,'due_at')||null});break;
case 'task-toggle':path='/app/plan';result=await client.from('plan_tasks').update({completed_at:text(f,'done')==='yes'?null:new Date().toISOString()}).eq('id',uuid.parse(text(f,'id'))).eq('user_id',user.id);break;
case 'task-edit':path='/app/plan';result=await client.from('plan_tasks').update({title:z.string().trim().min(2).max(200).parse(text(f,'title')),notes:text(f,'notes').slice(0,3000),due_at:text(f,'due_at')||null}).eq('id',uuid.parse(text(f,'id'))).eq('user_id',user.id);break;
case 'reorder':path='/app/plan';result=await client.rpc('reorder_tasks',{p_ids:text(f,'ids').split(',').map(v=>uuid.parse(v.trim()))});break;
case 'preferences':path='/app/settings';result=await client.from('notification_preferences').upsert({user_id:user.id,in_app:f.get('in_app')==='on',email:false});break;
case 'task-delete':path='/app/plan';result=await client.from('plan_tasks').delete().eq('id',uuid.parse(text(f,'id'))).eq('user_id',user.id);break;
case 'goal':path='/app/plan';result=await client.rpc('change_goal',{p_course:uuid.parse(text(f,'course'))});break;
case 'utme':path='/app/eligibility';result=await client.rpc('save_utme',{p_score:z.coerce.number().int().min(0).max(400).parse(text(f,'score')),p_subjects:text(f,'subjects').split(',').map(v=>v.trim()).filter(Boolean)});break;
case 'eligibility':path='/app/eligibility';result=await client.rpc('evaluate_admission',{p_rule:uuid.parse(text(f,'rule'))});if(result.data){const d=result.data as {status?:string;gaps?:string[];missing?:string[]};if(d.status==='MEETS_RULES'){message='Admission Check: You meet all published entry benchmarks for this program!';}else if(d.status==='INCOMPLETE_DATA'){const m=d.missing?.length?` (Missing: ${d.missing.join(', ')})`:'';message=`Evaluation complete: Incomplete academic data${m}.`;}else if(d.status==='DOES_NOT_MEET_RULES'){const c=d.gaps?.length||0;message=`Evaluation complete: Benchmarks not yet met (${c} requirement${c===1?'':'s'} to improve).`;}else{message='Admission evaluation completed and recorded.';}}break;
case 'book':{path='/app/counseling';const bookTopic=z.string().trim().min(2).max(1500).parse(text(f,'topic'));result=await client.rpc('book_session',{p_slot:uuid.parse(text(f,'slot')),p_topic:bookTopic});if(result.data){await attachGoogleMeetToSession(result.data as string,bookTopic);}break;}
case 'cancel':case 'complete':path='/app/counseling';result=await client.rpc(op==='cancel'?'cancel_session':'complete_session',{p_session:uuid.parse(text(f,'id'))});break;
case 'reschedule':path='/app/counseling';result=await client.rpc('reschedule_session',{p_session:uuid.parse(text(f,'id')),p_slot:uuid.parse(text(f,'slot'))});break;
case 'review':path='/app/counseling';result=await client.rpc('review_session',{p_session:uuid.parse(text(f,'id')),p_rating:z.coerce.number().int().min(1).max(5).parse(text(f,'rating')),p_review:text(f,'review').slice(0,2000)});break;
case 'slot':path='/app/counseling';result=await client.from('counselor_slots').insert({counselor_id:user.id,starts_at:new Date(text(f,'start')).toISOString(),ends_at:new Date(text(f,'end')).toISOString()});break;
case 'slot-delete':path='/app/counseling';result=await client.from('counselor_slots').delete().eq('id',uuid.parse(text(f,'id'))).eq('counselor_id',user.id);break;
case 'learn':path='/app/learning';result=await client.from('learning_progress').upsert({user_id:user.id,resource_id:uuid.parse(text(f,'id')),completed_at:text(f,'done')==='yes'?null:new Date().toISOString()});break;
case 'answer':path='/app/learning';result=await client.rpc('answer_question',{p_question:uuid.parse(text(f,'id')),p_choice:z.coerce.number().int().min(0).parse(text(f,'choice'))});if(result.data)message=(result.data.correct?'Correct. ':'Try again. ')+result.data.explanation;break;
case 'read':path='/app/notifications';result=await client.from('notifications').update({read_at:new Date().toISOString()}).eq('id',uuid.parse(text(f,'id'))).eq('user_id',user.id);break;
case 'conversation':path='/app/ai';result=await client.from('conversations').insert({user_id:user.id,title:text(f,'title').trim().slice(0,150)||'New conversation',use_academic_context:f.get('context')==='on'}).select('id').single();break;
default:throw new Error('Unknown action');}
if(result?.error)throw new Error(result.error.message);
}catch(e){error=e instanceof Error?e.message:'Unable to save. Retry when online.';}revalidatePath(path);redirect(path+'?'+new URLSearchParams(error?{error}:{message}));}
