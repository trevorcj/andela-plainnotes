import 'server-only';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { supabaseConfig } from '@/lib/env';import {safeReturnTo} from '@/lib/validation';
export async function requireUser(returnTo='/app'){if(!supabaseConfig())redirect('/setup');const client=await db();const {data:{user},error}=await client.auth.getUser();if(error||!user)redirect('/auth/sign-in?next='+encodeURIComponent(safeReturnTo(returnTo)));return {client,user};}
export async function requireAdmin(){const session=await requireUser();const {data,error}=await session.client.rpc('has_role',{wanted:'admin'});if(error||data!==true)redirect('/forbidden');return session;}
export async function studentContext(){const {client,user}=await requireUser();const {data:profile,error}=await client.from('profiles').select('*').eq('user_id',user.id).single();if(error)throw new Error('Your profile could not be loaded. Please retry.');return {client,user,profile};}
