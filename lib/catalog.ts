import 'server-only';
import {db} from '@/lib/supabase/server';import {escapeLike} from '@/lib/validation';
export type Source={id:string;name:string;url:string;publisher:string;status:string;verified_at:string|null;review_note:string;published:boolean};
export type Course={id:string;slug:string;name:string;field:string;description:string;duration_years:number|null;image_url:string|null;sources:Source|null};
export type University={id:string;slug:string;name:string;short_name:string;state:string;institution_type:string;website:string;description:string;sources:Source|null};
export type Career={id:string;slug:string;name:string;field:string;description:string;skills:string[];sources:Source|null};
export type CatalogKind='courses'|'universities'|'careers';
export const fields=['Health Sciences','Science & Technology','Engineering','Social Sciences','Business'];
export type SearchParams=Record<string,string|string[]|undefined>;
export function listParams(p:SearchParams){return {q:typeof p.q==='string'?p.q.slice(0,100):'',field:typeof p.field==='string'?p.field:'',type:typeof p.type==='string'?p.type:'',state:typeof p.state==='string'?p.state:'',page:Math.max(1,Math.min(1000,Number.isInteger(Number(p.page))?Number(p.page):1))};}
export const PAGE_SIZE = 24;
export async function catalogList(kind:CatalogKind,p:SearchParams){const {q,field,type,state,page}=listParams(p),client=await db();let request=client.from(kind).select('*,sources(*)',{count:'exact'}).eq('published',true);if(q)request=request.ilike('name',`%${escapeLike(q)}%`);if(field&&fields.includes(field)&&kind!=='universities')request=request.eq('field',field);if(type&&['Federal','State','Private'].includes(type)&&kind==='universities')request=request.eq('institution_type',type);if(state&&kind==='universities')request=request.eq('state',state);const {data,error,count}=await request.order('name').range((page-1)*PAGE_SIZE,page*PAGE_SIZE-1);if(error)throw new Error('The catalog could not be loaded. Please retry.');return {items:data as unknown as (Course|University|Career)[],count:count||0,page};}
export async function catalogItem(kind:CatalogKind,slug:string){const client=await db();const {data,error}=await client.from(kind).select('*,sources(*)').eq('slug',slug).eq('published',true).maybeSingle();if(error)throw new Error('The details could not be loaded. Please retry.');return data as unknown as Course|University|Career|null;}
export async function savedIds(){const client=await db();const {data,error}=await client.from('saved_items').select('course_id,university_id,career_id');if(error)throw new Error('Saved items could not be loaded');return new Set((data||[]).flatMap(v=>[v.course_id,v.university_id,v.career_id]).filter(Boolean));}
