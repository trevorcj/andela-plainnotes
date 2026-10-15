import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from '@/lib/env';
export async function db(){const config=supabaseConfig();if(!config)throw new Error('Supabase is not configured');const jar=await cookies();return createServerClient(config.url,config.key,{cookies:{getAll(){return jar.getAll()},setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,{...options,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'}))}catch{/* Server Components cannot set cookies; middleware refreshes them. */}}}});}
