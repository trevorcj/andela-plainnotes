begin;
alter table public.goals add constraint goal_owner_pair unique(id,user_id);
create table public.plan_tasks(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,goal_id uuid, title text not null check(length(trim(title)) between 2 and 200),notes text not null default '' check(length(notes)<=3000),due_at date,position integer not null default 0 check(position>=0),completed_at timestamptz,created_at timestamptz not null default now(),foreign key(goal_id,user_id) references public.goals(id,user_id) on delete cascade);
create table public.admission_rules(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses(id),university_id uuid not null references public.universities(id),admission_cycle text not null,source_id uuid not null references public.sources(id),required_subjects text[] not null check(cardinality(required_subjects)>0),min_utme integer check(min_utme between 0 and 400),max_sittings smallint not null check(max_sittings between 1 and 2),valid_until date not null,published boolean not null default false,unique(course_id,university_id,admission_cycle));
alter table public.academic_profiles add column utme_score integer check(utme_score between 0 and 400);
create table public.eligibility_checks(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,rule_id uuid references public.admission_rules(id),status text not null check(status in('MEETS_RULES','DOES_NOT_MEET_RULES','INCOMPLETE_DATA','NEEDS_VERIFICATION')),details jsonb not null,created_at timestamptz not null default now());
create table public.counselor_profiles(user_id uuid primary key references auth.users(id) on delete cascade,name text not null,specialty text not null,bio text not null,languages text not null,approved boolean not null default false,meeting_url text check(meeting_url is null or meeting_url ~ '^https://[^[:space:]]+$'));
create table public.counselor_slots(id uuid primary key default gen_random_uuid(),counselor_id uuid not null references public.counselor_profiles(user_id) on delete cascade,starts_at timestamptz not null,ends_at timestamptz not null,check(ends_at>starts_at and ends_at<=starts_at+interval '2 hours'),unique(counselor_id,starts_at));
create table public.sessions(id uuid primary key default gen_random_uuid(),student_id uuid not null references auth.users(id) on delete cascade,counselor_id uuid not null references public.counselor_profiles(user_id),slot_id uuid not null references public.counselor_slots(id),topic text not null check(length(trim(topic)) between 2 and 1500),status text not null default 'confirmed' check(status in('confirmed','canceled','completed')),meeting_url text,created_at timestamptz not null default now(),check(student_id<>counselor_id));
create unique index one_booking_per_slot on public.sessions(slot_id) where status='confirmed';
create table public.session_reviews(session_id uuid primary key references public.sessions(id) on delete cascade,student_id uuid not null references auth.users(id) on delete cascade,counselor_id uuid not null references public.counselor_profiles(user_id),rating smallint not null check(rating between 1 and 5),review text not null check(length(review)<=2000),created_at timestamptz not null default now());
create table public.learning_resources(id uuid primary key default gen_random_uuid(),title text not null,description text not null,resource_type text not null check(resource_type in('course','video','article','practice')),url text not null check(url ~ '^https://[^[:space:]]+$'),source_id uuid not null references public.sources(id),published boolean not null default false);
create table public.learning_progress(user_id uuid not null references auth.users(id) on delete cascade,resource_id uuid not null references public.learning_resources(id) on delete cascade,completed_at timestamptz,primary key(user_id,resource_id));
create table public.practice_questions(id uuid primary key default gen_random_uuid(),resource_id uuid not null references public.learning_resources(id),question text not null,choices jsonb not null check(jsonb_typeof(choices)='array'),published boolean not null default false);
-- Correct answers must never be returned in the public questions endpoint.
create table public.practice_answers(question_id uuid primary key references public.practice_questions(id) on delete cascade,answer_index smallint not null check(answer_index>=0),explanation text not null);
create table public.practice_attempts(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,question_id uuid not null references public.practice_questions(id),selected_index smallint not null,correct boolean not null,created_at timestamptz not null default now());
create table public.opportunities(id uuid primary key default gen_random_uuid(),title text not null,description text not null,provider text not null,kind text not null check(kind in('scholarship','internship','job','competition')),url text not null check(url ~ '^https://[^[:space:]]+$'),deadline timestamptz,source_id uuid not null references public.sources(id),published boolean not null default false);
create table public.conversations(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null default 'New conversation',use_academic_context boolean not null default false,created_at timestamptz not null default now(),unique(id,user_id));
create table public.chat_messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null,user_id uuid not null,role text not null check(role in('user','assistant')),content text not null check(length(content) between 1 and 20000),citations jsonb not null default '[]',request_id uuid,created_at timestamptz not null default now(),foreign key(conversation_id,user_id) references public.conversations(id,user_id) on delete cascade,unique(conversation_id,request_id,role));
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null,body text not null,target_path text not null check(target_path ~ '^/app/'),read_at timestamptz,created_at timestamptz not null default now());
create table public.notification_preferences(user_id uuid primary key references auth.users(id) on delete cascade,in_app boolean not null default true,email boolean not null default false);

-- Private records: owner only. User ids always come from auth.uid() in RPCs/server actions.
do $$ declare t text;begin foreach t in array array['plan_tasks','eligibility_checks','learning_progress','practice_attempts','conversations','chat_messages','notifications','notification_preferences'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner on public.%I for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid())',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);end loop;end;$$;
-- Results, assistant output and notification contents are written only by server/RPC paths.
revoke insert,update,delete on public.practice_attempts,public.chat_messages,public.notifications from authenticated;
grant update(read_at) on public.notifications to authenticated;
revoke insert,update,delete on public.eligibility_checks from authenticated;
-- The API uses user sessions to write checks; INSERT alone is allowed, never other users' rows.
grant insert on public.eligibility_checks to authenticated;

do $$declare t text;begin foreach t in array array['admission_rules','learning_resources','practice_questions','opportunities'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy published on public.%I for select to authenticated using(published)',t);
 execute format('create policy admin on public.%I for all to authenticated using(public.has_role(''admin'')) with check(public.has_role(''admin''))',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);end loop;end;$$;
alter table public.practice_answers enable row level security;
create policy admin_answers on public.practice_answers for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
grant select,insert,update,delete on public.practice_answers to authenticated;
alter table public.counselor_profiles enable row level security;
create policy directory on public.counselor_profiles for select to authenticated using(approved or user_id=auth.uid() or public.has_role('admin'));
grant select on public.counselor_profiles to authenticated;
alter table public.counselor_slots enable row level security;
create policy slots_read on public.counselor_slots for select to authenticated using(exists(select 1 from public.counselor_profiles p where p.user_id=counselor_id and p.approved));
create policy slots_manage on public.counselor_slots for all to authenticated using(counselor_id=auth.uid() and public.has_role('counselor')) with check(counselor_id=auth.uid() and public.has_role('counselor'));
grant select,insert,update,delete on public.counselor_slots to authenticated;
alter table public.sessions enable row level security;
create policy participants on public.sessions for select to authenticated using(student_id=auth.uid() or counselor_id=auth.uid());
grant select on public.sessions to authenticated;
alter table public.session_reviews enable row level security;
create policy reviews_read on public.session_reviews for select to authenticated using(true);
grant select on public.session_reviews to authenticated;

create function public.set_utme(p_score integer) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 update public.academic_profiles set utme_score=p_score where user_id=auth.uid();end;$$;
create function public.approve_counselor(p_user uuid,p_meeting_url text) returns void language plpgsql security definer set search_path='' as $$declare a public.counselor_applications;begin
 if not public.has_role('admin') then raise exception 'Administrator required';end if;
 if p_meeting_url is null or p_meeting_url !~ '^https://[^[:space:]]+$' then raise exception 'Real meeting URL required';end if;
 select * into a from public.counselor_applications where user_id=p_user and status='submitted';
 if not found then raise exception 'Submitted application required';end if;
 insert into public.counselor_profiles(user_id,name,specialty,bio,languages,approved,meeting_url) values(p_user,a.name,a.specialty,a.bio,a.languages,true,p_meeting_url)
 on conflict(user_id) do update set name=excluded.name,specialty=excluded.specialty,bio=excluded.bio,languages=excluded.languages,approved=true,meeting_url=excluded.meeting_url;
 insert into public.user_roles(user_id,role) values(p_user,'counselor') on conflict do nothing;end;$$;
create function public.book_session(p_slot uuid,p_topic text) returns uuid language plpgsql security definer set search_path='' as $$declare s public.counselor_slots;uid uuid:=auth.uid();sid uuid;meeting text;begin
 if uid is null then raise exception 'Authentication required';end if;
 select * into s from public.counselor_slots where id=p_slot for update;
 if not found or s.starts_at<=now() then raise exception 'Slot is unavailable';end if;
 select meeting_url into meeting from public.counselor_profiles where user_id=s.counselor_id and approved;
 if not found or meeting is null then raise exception 'Counselor is unavailable';end if;
 if exists(select 1 from public.sessions where slot_id=p_slot and status='confirmed') then raise exception 'Slot already booked';end if;
 insert into public.sessions(student_id,counselor_id,slot_id,topic,meeting_url) values(uid,s.counselor_id,p_slot,p_topic,meeting) returning id into sid;
 insert into public.notifications(user_id,title,body,target_path) values(uid,'Session booked','Your session is confirmed.','/app/counseling'),(s.counselor_id,'New session','A student has booked an available time.','/app/counseling');return sid;end;$$;
create function public.cancel_session(p_session uuid) returns void language plpgsql security definer set search_path='' as $$declare s public.sessions;begin
 select * into s from public.sessions where id=p_session for update;
 if not found or auth.uid() is null or auth.uid() not in(s.student_id,s.counselor_id) then raise exception 'Session not found';end if;
 if s.status<>'confirmed' then raise exception 'Only confirmed sessions can be canceled';end if;
 update public.sessions set status='canceled' where id=p_session;
 insert into public.notifications(user_id,title,body,target_path) values(s.student_id,'Session canceled','A booked session was canceled.','/app/counseling'),(s.counselor_id,'Session canceled','A booked session was canceled.','/app/counseling');end;$$;
create function public.reschedule_session(p_session uuid,p_slot uuid) returns void language plpgsql security definer set search_path='' as $$declare s public.sessions;slot public.counselor_slots;begin
 select * into s from public.sessions where id=p_session for update;
 if not found or auth.uid() is null or s.student_id<>auth.uid() or s.status<>'confirmed' then raise exception 'Session not found';end if;
 select * into slot from public.counselor_slots where id=p_slot for update;
 if not found or slot.counselor_id<>s.counselor_id or slot.starts_at<=now() then raise exception 'Slot unavailable';end if;
 if exists(select 1 from public.sessions where slot_id=p_slot and status='confirmed' and id<>p_session) then raise exception 'Slot already booked';end if;
 update public.sessions set slot_id=p_slot where id=p_session;
 insert into public.notifications(user_id,title,body,target_path) values(s.student_id,'Session rescheduled','Your booking time has changed.','/app/counseling'),(s.counselor_id,'Session rescheduled','A student changed their booking time.','/app/counseling');end;$$;
create function public.complete_session(p_session uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.sessions s join public.counselor_slots t on t.id=s.slot_id where s.id=p_session and s.counselor_id=auth.uid() and s.status='confirmed' and t.ends_at<=now()) then raise exception 'Completed session time required';end if;
 update public.sessions set status='completed' where id=p_session;end;$$;
create function public.review_session(p_session uuid,p_rating smallint,p_review text) returns void language plpgsql security definer set search_path='' as $$declare s public.sessions;begin
 select * into s from public.sessions where id=p_session and student_id=auth.uid() and status='completed';if not found then raise exception 'Your completed session is required';end if;
 insert into public.session_reviews(session_id,student_id,counselor_id,rating,review) values(s.id,s.student_id,s.counselor_id,p_rating,p_review);end;$$;
create function public.answer_question(p_question uuid,p_choice smallint) returns jsonb language plpgsql security definer set search_path='' as $$declare a public.practice_answers;q public.practice_questions;ok boolean;begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 select * into q from public.practice_questions where id=p_question and published and exists(select 1 from public.learning_resources l join public.sources s on s.id=l.source_id where l.id=resource_id and l.published and s.published and s.status='verified' and s.verified_at between now()-interval '180 days' and now());if not found then raise exception 'Question unavailable';end if;
 if p_choice<0 or p_choice>=jsonb_array_length(q.choices) then raise exception 'Invalid choice';end if;
 select * into a from public.practice_answers where question_id=q.id;if not found then raise exception 'Answer awaiting publication';end if;ok:=a.answer_index=p_choice;
 insert into public.practice_attempts(user_id,question_id,selected_index,correct) values(auth.uid(),q.id,p_choice,ok);
 return jsonb_build_object('correct',ok,'explanation',a.explanation);end;$$;
-- Authenticated users may add only USER messages. Assistant messages are written by the Edge Function using a server-only credential.
create function public.add_chat_message(p_conversation uuid,p_request uuid,p_content text) returns uuid language plpgsql security definer set search_path='' as $$declare mid uuid;begin
 if not exists(select 1 from public.conversations where id=p_conversation and user_id=auth.uid()) then raise exception 'Conversation not found';end if;
 insert into public.chat_messages(conversation_id,user_id,role,content,request_id) values(p_conversation,auth.uid(),'user',p_content,p_request) on conflict(conversation_id,request_id,role) do update set content=public.chat_messages.content returning id into mid;return mid;end;$$;
-- Reviewed counselor contact URLs are exposed only through participant-owned sessions.
revoke select on public.counselor_profiles from authenticated;
grant select(user_id,name,specialty,bio,languages,approved) on public.counselor_profiles to authenticated;
do $$declare sig text;begin foreach sig in array array['set_utme(integer)','approve_counselor(uuid,text)','book_session(uuid,text)','cancel_session(uuid)','reschedule_session(uuid,uuid)','complete_session(uuid)','review_session(uuid,smallint,text)','answer_question(uuid,smallint)','add_chat_message(uuid,uuid,text)'] loop
 execute 'revoke all on function public.'||sig||' from public';execute 'grant execute on function public.'||sig||' to authenticated';end loop;end;$$;
create index tasks_owner on public.plan_tasks(user_id,position);
create index slots_future on public.counselor_slots(counselor_id,starts_at);
create index session_participants on public.sessions(student_id,counselor_id);
create index chat_history on public.chat_messages(conversation_id,created_at);
commit;
