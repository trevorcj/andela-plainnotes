begin;
create table public.ai_requests(id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,conversation_id uuid not null references public.conversations(id) on delete cascade,status text not null default 'pending' check(status in('pending','complete','failed')),created_at timestamptz not null default now());
alter table public.ai_requests enable row level security;
create policy own_requests on public.ai_requests for select to authenticated using(user_id=auth.uid());grant select on public.ai_requests to authenticated;
create function public.claim_ai_request(p_id uuid,p_conversation uuid,p_content text) returns void language plpgsql security definer set search_path='' as $$declare uid uuid:=auth.uid();begin
 if uid is null then raise exception 'Authentication required';end if;
 perform 1 from public.profiles where user_id=uid for update;
 if not exists(select 1 from public.conversations where id=p_conversation and user_id=uid) then raise exception 'Conversation not found';end if;
 if exists(select 1 from public.ai_requests where id=p_id) then raise exception 'Request has already been submitted';end if;
 if exists(select 1 from public.ai_requests where user_id=uid and status='pending' and created_at>now()-interval '2 minutes') then raise exception 'Wait for the current answer';end if;
 if (select count(*) from public.ai_requests where user_id=uid and created_at>now()-interval '1 hour')>=30 then raise exception 'Hourly AI limit reached';end if;
 if length(trim(p_content)) not between 1 and 4000 then raise exception 'Message must be between 1 and 4000 characters';end if;
 insert into public.ai_requests(id,user_id,conversation_id) values(p_id,uid,p_conversation);
 perform public.add_chat_message(p_conversation,p_id,p_content);
end;$$;
revoke all on function public.claim_ai_request(uuid,uuid,text) from public;grant execute on function public.claim_ai_request(uuid,uuid,text) to authenticated;
grant select,update on public.ai_requests to service_role;
grant usage on schema public to service_role;
commit;
