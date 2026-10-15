import Link from 'next/link';
import {requireUser} from '@/lib/auth';
import {Action,Id,Notice,Empty,Submit} from '@/components/workflow';
import {Target,Plus,CheckCircle2,Clock,Trash2,Calendar} from 'lucide-react';

export default async function Page({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
  const {client}=await requireUser();
  const [tasks,goals,courses]=await Promise.all([
    client.from('plan_tasks').select('*').order('position').order('created_at'),
    client.from('goals').select('*').eq('active',true),
    client.from('courses').select('id,name').eq('published',true).order('name')
  ]);

  if(tasks.error||goals.error||courses.error) throw new Error('Unable to load your plan');

  const completedCount = tasks.data?.filter(t=>t.completed_at).length || 0;
  const totalCount = tasks.data?.length || 0;

  return (
    <div style={{maxWidth:920,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:800,letterSpacing:'-0.5px'}}>My Personalized Plan</h1>
        <p className="muted" style={{fontSize:14,marginTop:4}}>
          A step-by-step roadmap tailored to your target course, WAEC results, and UTME goals.
        </p>
      </div>

      <Notice params={await searchParams}/>

      {/* Goal Switcher */}
      <div className="panel" style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <Target size={18} color="#10b981"/>
          <h2 style={{fontSize:16,fontWeight:700}}>Target Course Goal</h2>
        </div>
        <Action op="goal">
          <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,alignItems:'center'}}>
            <select name="course" required defaultValue={goals.data?.[0]?.course_id||''} style={{borderRadius:8,fontSize:14}}>
              {courses.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Submit>Change Goal</Submit>
          </div>
        </Action>
      </div>

      {/* Add Step Card */}
      <div className="panel" style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <Plus size={18}/>
          <h2 style={{fontSize:16,fontWeight:700}}>Add a Plan Step</h2>
        </div>
        <Action op="task">
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <input name="title" placeholder="e.g. Register for JAMB CBT mock exam" minLength={2} maxLength={200} required style={{fontSize:14}}/>
            <textarea name="notes" placeholder="Notes, syllabus focus, or target score..." maxLength={3000} style={{fontSize:13,minHeight:60}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,alignItems:'flex-end'}}>
              <label style={{fontSize:12,fontWeight:600}}>
                Target Completion Date
                <input name="due_at" type="date" style={{marginTop:4,fontSize:13}}/>
              </label>
              <Submit>Add Step</Submit>
            </div>
          </div>
        </Action>
      </div>

      {/* Roadmap List */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{fontSize:18,fontWeight:700}}>Roadmap Steps</h3>
        <span style={{fontSize:12,fontWeight:600,color:'#71717a'}}>
          {completedCount} of {totalCount} completed
        </span>
      </div>

      {!tasks.data?.length ? (
        <div className="panel" style={{textAlign:'center',padding:'40px 20px'}}>
          <p className="muted" style={{fontSize:14}}>You don't have any steps in your plan yet. Add your first preparation milestone above.</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {tasks.data.map((t,idx)=>(
            <article key={t.id} className="panel" style={{display:'flex',gap:16,alignItems:'flex-start',padding:16}}>
              <div style={{marginTop:2}}>
                <Action op="task-toggle">
                  <Id id={t.id}/>
                  <input type="hidden" name="done" value={t.completed_at?'yes':'no'}/>
                  <button type="submit" style={{background:'none',border:'none',padding:0,cursor:'pointer'}}>
                    {t.completed_at ? <CheckCircle2 size={22} color="#10b981"/> : <Clock size={22} color="#a1a1aa"/>}
                  </button>
                </Action>
              </div>

              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <h4 style={{fontSize:15,fontWeight:700,textDecoration:t.completed_at?'line-through':'none',color:t.completed_at?'#71717a':'#09090b'}}>
                    {idx+1}. {t.title}
                  </h4>
                  {t.due_at && (
                    <span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#71717a',background:'#f4f4f5',padding:'2px 8px',borderRadius:6}}>
                      <Calendar size={12}/> {t.due_at}
                    </span>
                  )}
                </div>

                {t.notes && <p style={{fontSize:13,color:'#52525b',margin:'6px 0 0'}}>{t.notes}</p>}

                <div style={{display:'flex',gap:12,alignItems:'center',marginTop:12,fontSize:12}}>
                  <details>
                    <summary style={{cursor:'pointer',color:'#71717a'}}>Edit details</summary>
                    <div style={{marginTop:8}}>
                      <Action op="task-edit">
                        <Id id={t.id}/>
                        <input name="title" defaultValue={t.title} required minLength={2} maxLength={200} style={{fontSize:13,marginBottom:6}}/>
                        <textarea name="notes" defaultValue={t.notes} style={{fontSize:12,marginBottom:6}}/>
                        <input type="date" name="due_at" defaultValue={t.due_at||''} style={{fontSize:12,marginBottom:6}}/>
                        <Submit>Save</Submit>
                      </Action>
                    </div>
                  </details>

                  <Action op="task-delete">
                    <Id id={t.id}/>
                    <button style={{color:'#ef4444',border:'none',background:'none',padding:0,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                      <Trash2 size={13}/> Delete
                    </button>
                  </Action>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
