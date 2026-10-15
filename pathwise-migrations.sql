-- Apply with Supabase CLI. Never apply an individual fragment of this migration.
begin;
create type public.app_role as enum ('student','counselor','admin');
create table public.user_roles (
 user_id uuid not null references auth.users(id) on delete cascade,
 role public.app_role not null, primary key(user_id,role)
);
create function public.has_role(wanted public.app_role) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.user_roles where user_id=auth.uid() and role=wanted);
$$;
revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to authenticated;
alter table public.user_roles enable row level security;
create policy own_roles on public.user_roles for select to authenticated using(user_id=auth.uid());
grant select on public.user_roles to authenticated;
revoke insert,update,delete on public.user_roles from anon,authenticated;

create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '' check(char_length(full_name)<=100),
 stage text check(stage in ('secondary','university','guardian')),
 location text not null default '' check(char_length(location)<=100),
 onboarding_completed_at timestamptz,
 updated_at timestamptz not null default now()
);
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(user_id,full_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),100));
 insert into public.user_roles(user_id,role) values(new.id,'student');
 return new;
end;$$;
revoke all on function public.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
-- Backfill existing accounts when connecting a pre-existing project.
insert into public.profiles(user_id) select id from auth.users on conflict do nothing;
insert into public.user_roles(user_id,role) select id,'student' from auth.users on conflict do nothing;

create table public.sources (
 id uuid primary key default gen_random_uuid(), name text not null check(char_length(name) between 2 and 200),
 url text not null check(url ~ '^https://[^[:space:]]+$'),
 publisher text not null check(char_length(publisher) between 2 and 200),
 status text not null default 'pending' check(status in ('pending','verified','retired')),
 verified_at timestamptz, review_note text not null default '' check(char_length(review_note)<=3000),
 published boolean not null default false,
 updated_at timestamptz not null default now(),
 check(status<>'verified' or (verified_at is not null and char_length(trim(review_note))>=20))
);
create table public.courses (
 id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text not null check(char_length(name) between 2 and 200),
 field text not null, description text not null, duration_years smallint check(duration_years between 1 and 10),
 image_url text check(image_url is null or image_url ~ '^https://'),
 source_id uuid not null references public.sources(id) on delete restrict,
 published boolean not null default false, updated_at timestamptz not null default now()
);
create table public.universities (
 id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text not null, short_name text not null, state text not null,
 institution_type text not null check(institution_type in ('Federal','State','Private')),
 website text not null check(website ~ '^https://[^[:space:]]+$'), description text not null,
 source_id uuid not null references public.sources(id) on delete restrict,
 published boolean not null default false, updated_at timestamptz not null default now()
);
create table public.careers (
 id uuid primary key default gen_random_uuid(),slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text not null,field text not null,description text not null,skills text[] not null default '{}',
 source_id uuid not null references public.sources(id) on delete restrict,
 published boolean not null default false,updated_at timestamptz not null default now()
);
create table public.course_careers (
 course_id uuid not null references public.courses(id) on delete cascade,
 career_id uuid not null references public.careers(id) on delete cascade,
 primary key(course_id,career_id)
);
create table public.university_courses (
 university_id uuid not null references public.universities(id) on delete cascade,
 course_id uuid not null references public.courses(id) on delete cascade,
 source_id uuid not null references public.sources(id) on delete restrict,
 admission_cycle text not null, notes text not null default '', published boolean not null default false,
 primary key(university_id,course_id,admission_cycle)
);
create table public.onboarding_drafts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 step smallint not null default 1 check(step between 1 and 4),
 payload jsonb not null default '{}' check(jsonb_typeof(payload)='object'),
 updated_at timestamptz not null default now()
);
create table public.academic_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 school_year text not null check(school_year in ('SS1','SS2','SS3','Graduate','Year 1','Year 2','Year 3','Year 4+','Guardian')),
 school_name text not null default '' check(char_length(school_name)<=200),
 interests text[] not null default '{}', target_course_id uuid not null references public.courses(id),
 updated_at timestamptz not null default now(),check(cardinality(interests)<=12)
);
create table public.exam_records (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 exam_type text not null check(exam_type in ('WAEC','NECO')), exam_year integer not null check(exam_year between 2000 and 2100),
 sitting smallint not null check(sitting between 1 and 2), unique(user_id,sitting)
);
create table public.exam_grades (
 exam_id uuid not null references public.exam_records(id) on delete cascade,
 subject text not null check(char_length(subject) between 2 and 100),
 grade text not null check(grade in ('A1','B2','B3','C4','C5','C6','D7','E8','F9')),
 primary key(exam_id,subject)
);
create table public.goals (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 course_id uuid not null references public.courses(id),title text not null check(char_length(title) between 2 and 200),
 active boolean not null default true,created_at timestamptz not null default now()
);
create unique index one_active_goal on public.goals(user_id) where active;
create table public.saved_items (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 course_id uuid references public.courses(id) on delete cascade,
 university_id uuid references public.universities(id) on delete cascade,
 career_id uuid references public.careers(id) on delete cascade,
 created_at timestamptz not null default now(),check(num_nonnulls(course_id,university_id,career_id)=1),
 unique(user_id,course_id),unique(user_id,university_id),unique(user_id,career_id)
);
create table public.source_audit (
 id uuid primary key default gen_random_uuid(), source_id uuid not null references public.sources(id),
 actor_id uuid not null references auth.users(id), action text not null,
 before_record jsonb,after_record jsonb,created_at timestamptz not null default now()
);
create function public.audit_source() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null then
 insert into public.source_audit(source_id,actor_id,action,before_record,after_record)
 values(new.id,auth.uid(),TG_OP,case when TG_OP='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
 end if;return new;
end;$$;
revoke all on function public.audit_source() from public;
create trigger audit_source_write after insert or update on public.sources for each row execute function public.audit_source();

-- Owner policies are evaluated by PostgreSQL for every operation.
do $$ declare t text; begin
 foreach t in array array['profiles','onboarding_drafts','academic_profiles','exam_records','goals','saved_items'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner_select on public.%I for select to authenticated using(user_id=auth.uid())',t);
 execute format('create policy owner_insert on public.%I for insert to authenticated with check(user_id=auth.uid())',t);
 execute format('create policy owner_update on public.%I for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid())',t);
 execute format('create policy owner_delete on public.%I for delete to authenticated using(user_id=auth.uid())',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
end;$$;
alter table public.exam_grades enable row level security;
create policy owner_grades on public.exam_grades for all to authenticated using(exists(select 1 from public.exam_records e where e.id=exam_id and e.user_id=auth.uid())) with check(exists(select 1 from public.exam_records e where e.id=exam_id and e.user_id=auth.uid()));
grant select,insert,update,delete on public.exam_grades to authenticated;

do $$ declare t text; begin
 foreach t in array array['sources','courses','universities','careers','university_courses'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy published_read on public.%I for select to anon,authenticated using(published)',t);
 execute format('create policy admin_manage on public.%I for all to authenticated using(public.has_role(''admin'')) with check(public.has_role(''admin''))',t);
 execute format('grant select on public.%I to anon,authenticated',t);
 execute format('grant insert,update,delete on public.%I to authenticated',t);
 end loop;
end;$$;
alter table public.course_careers enable row level security;
create policy published_links on public.course_careers for select to anon,authenticated using(exists(select 1 from public.courses c where c.id=course_id and c.published) and exists(select 1 from public.careers c where c.id=career_id and c.published));
create policy admin_links on public.course_careers for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
grant select on public.course_careers to anon,authenticated;
grant insert,update,delete on public.course_careers to authenticated;
alter table public.source_audit enable row level security;
create policy admin_read_audit on public.source_audit for select to authenticated using(public.has_role('admin'));
grant select on public.source_audit to authenticated;
revoke insert,update,delete on public.source_audit from anon,authenticated;

-- Transactional completion: ownership comes only from auth.uid(), never caller input.
create function public.complete_onboarding(p_payload jsonb) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); cid uuid; v_full_name text; selected_stage text; exam jsonb; result jsonb; eid uuid; idx integer:=0; selected_interests text[];
begin
 if uid is null then raise exception 'Authentication required';end if;
 if jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid payload';end if;
 v_full_name:=trim(p_payload->>'fullName');selected_stage:=p_payload->>'stage';
 if v_full_name is null or length(v_full_name)<2 or length(v_full_name)>100 then raise exception 'Full name required';end if;
 if selected_stage is null or selected_stage not in ('secondary','university','guardian') then raise exception 'Invalid stage';end if;
 if not (p_payload->>'schoolYear'=any(case selected_stage when 'secondary' then array['SS1','SS2','SS3','Graduate'] when 'university' then array['Year 1','Year 2','Year 3','Year 4+'] else array['Guardian'] end)) then raise exception 'Invalid school year';end if;
 cid:=(p_payload->>'targetCourseId')::uuid;
 if not exists(select 1 from public.courses where id=cid and published) then raise exception 'Select a published course';end if;
 if jsonb_typeof(p_payload->'interests')<>'array' or jsonb_array_length(p_payload->'interests')<1 or jsonb_array_length(p_payload->'interests')>12 then raise exception 'Choose 1 to 12 interests';end if;
 if exists(select 1 from jsonb_array_elements(p_payload->'interests') v where jsonb_typeof(v)<>'string' or length(trim(v#>>'{}')) not between 2 and 80) then raise exception 'Invalid interest';end if;
 select array_agg(v) into selected_interests from jsonb_array_elements_text(p_payload->'interests') v;
 if jsonb_typeof(p_payload->'exams')<>'array' or jsonb_array_length(p_payload->'exams')>2 then raise exception 'At most two exam sittings allowed';end if;
 update public.profiles set full_name=v_full_name,stage=selected_stage,location=coalesce(p_payload->>'location',''),onboarding_completed_at=now(),updated_at=now() where user_id=uid;
 insert into public.academic_profiles(user_id,school_year,school_name,interests,target_course_id)
 values(uid,p_payload->>'schoolYear',coalesce(p_payload->>'schoolName',''),selected_interests,cid)
 on conflict(user_id) do update set school_year=excluded.school_year,school_name=excluded.school_name,interests=excluded.interests,target_course_id=excluded.target_course_id,updated_at=now();
 delete from public.exam_records where user_id=uid;
 for exam in select * from jsonb_array_elements(p_payload->'exams') loop
 idx:=idx+1;
 if jsonb_typeof(exam->'results')<>'array' or jsonb_array_length(exam->'results') not between 1 and 12 then raise exception 'Each sitting requires 1 to 12 results';end if;
 insert into public.exam_records(user_id,exam_type,exam_year,sitting) values(uid,exam->>'type',(exam->>'year')::int,idx) returning id into eid;
 for result in select * from jsonb_array_elements(exam->'results') loop
 insert into public.exam_grades(exam_id,subject,grade) values(eid,trim(result->>'subject'),result->>'grade');
 end loop;
 end loop;
 update public.goals set active=false where user_id=uid and active;
 insert into public.goals(user_id,course_id,title) select uid,cid,'Study '||name from public.courses where id=cid;
 insert into public.onboarding_drafts(user_id,step,payload) values(uid,4,p_payload) on conflict(user_id) do update set step=4,payload=excluded.payload,updated_at=now();
end;$$;
revoke all on function public.complete_onboarding(jsonb) from public;
grant execute on function public.complete_onboarding(jsonb) to authenticated;
create index courses_discovery on public.courses(published,field,name);
create index universities_discovery on public.universities(published,institution_type,state);
create index careers_discovery on public.careers(published,field,name);
create index saved_by_owner on public.saved_items(user_id,created_at desc);
create index exam_by_owner on public.exam_records(user_id);
-- Only the completion RPC may replace academic context or mark onboarding complete.
revoke insert,update,delete on public.profiles,public.academic_profiles,public.exam_records,public.exam_grades,public.goals from authenticated;
grant update(full_name,location,updated_at) on public.profiles to authenticated;

commit;


begin;
create table public.counselor_applications (
 user_id uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 2 and 100),
 specialty text not null check(specialty in ('Education & Course Counseling','University Admissions','Student Success','Career Guidance')),
 experience smallint not null check(experience between 0 and 60),
 qualifications text not null check(length(trim(qualifications)) between 5 and 1000),
 professional_url text check(professional_url is null or professional_url ~ '^https://[^[:space:]]+$'),
 languages text not null check(length(trim(languages)) between 2 and 200),
 bio text not null check(length(trim(bio)) between 30 and 1500),
 status text not null default 'draft' check(status in ('draft','submitted')),
 updated_at timestamptz not null default now()
);
alter table public.counselor_applications enable row level security;
create policy application_owner on public.counselor_applications for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy application_admin_read on public.counselor_applications for select to authenticated using(public.has_role('admin'));
grant select,insert,update,delete on public.counselor_applications to authenticated;
commit;


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


begin;
alter table public.admission_rules add column minimum_credit_grade text not null default 'C6' check(minimum_credit_grade in('A1','B2','B3','C4','C5','C6'));
alter table public.admission_rules add column allow_mixed_exams boolean not null default false;
alter table public.admission_rules add column utme_subjects text[] not null default '{}';
alter table public.academic_profiles add column utme_subjects text[] not null default '{}';
revoke insert on public.eligibility_checks from authenticated;
create function public.save_utme(p_score integer,p_subjects text[]) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if cardinality(p_subjects)>4 then raise exception 'At most four UTME subjects';end if;
 update public.academic_profiles set utme_score=p_score,utme_subjects=p_subjects where user_id=auth.uid();end;$$;
create function public.evaluate_admission(p_rule uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.admission_rules;src public.sources;uid uuid:=auth.uid();a public.academic_profiles;v_subject text;best integer;threshold integer;missing text[]:='{}';gaps text[]:='{}';status text;result jsonb;sittings integer;kinds integer;
begin
 if uid is null then raise exception 'Authentication required';end if;
 select * into r from public.admission_rules where id=p_rule and published;
 if not found then return jsonb_build_object('status','NEEDS_VERIFICATION','message','No published rule is available');end if;
 select * into src from public.sources where id=r.source_id and published;
 if not found or src.status<>'verified' or src.verified_at is null or src.verified_at<now()-interval '180 days' or src.verified_at>now() or r.valid_until<current_date then status:='NEEDS_VERIFICATION';
 else
 select * into a from public.academic_profiles where user_id=uid;
 select count(*),count(distinct exam_type) into sittings,kinds from public.exam_records where user_id=uid;
 if sittings=0 then missing:=array_append(missing,'Exam results');end if;
 if sittings>r.max_sittings then gaps:=array_append(gaps,'Maximum exam sittings exceeded');end if;
 if kinds>1 and not r.allow_mixed_exams then gaps:=array_append(gaps,'Mixed examination types are not allowed by this rule');end if;
 threshold:=array_position(array['A1','B2','B3','C4','C5','C6','D7','E8','F9'],r.minimum_credit_grade);
 foreach v_subject in array r.required_subjects loop
 select min(array_position(array['A1','B2','B3','C4','C5','C6','D7','E8','F9'],g.grade)) into best from public.exam_grades g join public.exam_records e on e.id=g.exam_id where e.user_id=uid and lower(trim(g.subject))=lower(trim(v_subject));
 if best is null then missing:=array_append(missing,v_subject);elsif best>threshold then gaps:=array_append(gaps,v_subject);end if;end loop;
 if r.min_utme is not null then if a.utme_score is null then missing:=array_append(missing,'UTME score');elsif a.utme_score<r.min_utme then gaps:=array_append(gaps,'UTME score below published threshold');end if;end if;
 foreach v_subject in array r.utme_subjects loop if not exists(select 1 from unnest(a.utme_subjects) v where lower(trim(v))=lower(trim(v_subject))) then if cardinality(a.utme_subjects)=4 then gaps:=array_append(gaps,'UTME combination lacks: '||v_subject);else missing:=array_append(missing,'UTME subject: '||v_subject);end if;end if;end loop;
 status:=case when cardinality(missing)>0 then 'INCOMPLETE_DATA' when cardinality(gaps)>0 then 'DOES_NOT_MEET_RULES' else 'MEETS_RULES' end;
 end if;
 result:=jsonb_build_object('status',status,'missing',missing,'gaps',gaps,'source_id',r.source_id,'rule_id',r.id,'cycle',r.admission_cycle,'note','Meeting published rules does not guarantee admission.');
 insert into public.eligibility_checks(user_id,rule_id,status,details) values(uid,r.id,status,result);return result;
end;$$;
create function public.reorder_tasks(p_ids uuid[]) returns void language plpgsql security definer set search_path='' as $$declare i integer:=0;tid uuid;begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 perform 1 from public.plan_tasks where user_id=auth.uid() for update;
 foreach tid in array p_ids loop if not exists(select 1 from public.plan_tasks where id=tid and user_id=auth.uid()) then raise exception 'Task not found';end if;update public.plan_tasks set position=i where id=tid;i:=i+1;end loop;end;$$;
create function public.change_goal(p_course uuid) returns void language plpgsql security definer set search_path='' as $$declare uid uuid:=auth.uid();n text;begin
 if uid is null then raise exception 'Authentication required';end if;select name into n from public.courses where id=p_course and published;if not found then raise exception 'Course unavailable';end if;
 perform 1 from public.profiles where user_id=uid for update;update public.goals set active=false where user_id=uid and active;
 insert into public.goals(user_id,course_id,title) values(uid,p_course,'Study '||n);update public.academic_profiles set target_course_id=p_course where user_id=uid;end;$$;
-- Existing bookings cannot be mutated or removed by directly changing a slot.
create function public.guard_slot_change() returns trigger language plpgsql security definer set search_path='' as $$begin
 if exists(select 1 from public.sessions where slot_id=old.id and status in('confirmed','completed')) then raise exception 'Booked slots cannot be changed or removed';end if;if tg_op='DELETE' then return old;end if;return new;end;$$;
create trigger protected_slot before update or delete on public.counselor_slots for each row execute function public.guard_slot_change();
-- Avoid overlapping available slots per counselor, including concurrent inserts.
create function public.check_slot_overlap() returns trigger language plpgsql security definer set search_path='' as $$begin
 perform 1 from public.counselor_profiles where user_id=new.counselor_id for update;
 if new.starts_at<=now() then raise exception 'Availability must be in the future';end if;
 if exists(select 1 from public.counselor_slots where counselor_id=new.counselor_id and id<>new.id and starts_at<new.ends_at and ends_at>new.starts_at) then raise exception 'Availability overlaps an existing slot';end if;return new;end;$$;
create trigger no_overlapping_slots before insert or update on public.counselor_slots for each row execute function public.check_slot_overlap();
create function public.revoke_counselor(p_user uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.has_role('admin') then raise exception 'Administrator required';end if;update public.counselor_profiles set approved=false where user_id=p_user;delete from public.user_roles where user_id=p_user and role='counselor';end;$$;
-- Account erasure keeps source audit history but removes the deleted actor's identity.
alter table public.source_audit drop constraint source_audit_actor_id_fkey;
alter table public.source_audit alter column actor_id drop not null;
alter table public.source_audit add foreign key(actor_id) references auth.users(id) on delete set null;
create function public.erase_my_account() returns void language plpgsql security definer set search_path='' as $$declare uid uuid:=auth.uid();begin
 if uid is null then raise exception 'Authentication required';end if;
 delete from public.sessions where student_id=uid or counselor_id=uid;
 delete from auth.users where id=uid;end;$$;
-- Privileged assistant writes are limited to the service role used by the Edge Function.
-- Supabase supplies service_role. The local test engine creates that role explicitly.
grant select on public.profiles,public.academic_profiles,public.courses,public.sources,public.conversations,public.chat_messages to service_role;
grant insert on public.chat_messages to service_role;
revoke all on function public.guard_slot_change() from public;
revoke all on function public.check_slot_overlap() from public;
do $$declare sig text;begin foreach sig in array array['save_utme(integer,text[])','evaluate_admission(uuid)','reorder_tasks(uuid[])','change_goal(uuid)','revoke_counselor(uuid)','erase_my_account()'] loop
 execute 'revoke all on function public.'||sig||' from public';execute 'grant execute on function public.'||sig||' to authenticated';end loop;end;$$;
commit;


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


begin;
create function public.publish_practice(p_record jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare qid uuid:=coalesce((p_record->>'id')::uuid,gen_random_uuid());rid uuid:=(p_record->>'resource_id')::uuid;begin
 if not public.has_role('admin') then raise exception 'Administrator required';end if;
 if jsonb_typeof(p_record->'choices')<>'array' or jsonb_array_length(p_record->'choices') not between 2 and 8 or (p_record->>'answer_index')::integer not between 0 and jsonb_array_length(p_record->'choices')-1 then raise exception 'Invalid answer choices';end if;
 if (p_record->>'published')::boolean and not exists(select 1 from public.learning_resources l join public.sources s on s.id=l.source_id where l.id=rid and l.published and s.published and s.status='verified' and s.verified_at between now()-interval '180 days' and now()) then raise exception 'Reviewed published resource required';end if;
 insert into public.practice_questions(id,resource_id,question,choices,published) values(qid,rid,p_record->>'question',p_record->'choices',(p_record->>'published')::boolean) on conflict(id) do update set resource_id=excluded.resource_id,question=excluded.question,choices=excluded.choices,published=excluded.published;
 insert into public.practice_answers(question_id,answer_index,explanation) values(qid,(p_record->>'answer_index')::smallint,p_record->>'explanation') on conflict(question_id) do update set answer_index=excluded.answer_index,explanation=excluded.explanation;
 return qid;end;$$;
revoke all on function public.publish_practice(jsonb) from public;grant execute on function public.publish_practice(jsonb) to authenticated;
-- Publishing checks also apply to direct API writes by administrators.
create function public.guard_workflow_publication() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.published and not exists(select 1 from public.sources where id=new.source_id and published and status='verified' and verified_at between now()-interval '180 days' and now()) then raise exception 'Recently reviewed source required for publication';end if;return new;end;$$;
create trigger reviewed_rules before insert or update on public.admission_rules for each row execute function public.guard_workflow_publication();
create trigger reviewed_resources before insert or update on public.learning_resources for each row execute function public.guard_workflow_publication();
create trigger reviewed_opportunities before insert or update on public.opportunities for each row execute function public.guard_workflow_publication();
revoke all on function public.guard_workflow_publication() from public;
-- Avoid advertising booked availability. Participants retain session details.
create function public.can_view_slot(p_slot uuid) returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and (not exists(select 1 from public.sessions where slot_id=p_slot and status='confirmed') or exists(select 1 from public.sessions where slot_id=p_slot and (student_id=auth.uid() or counselor_id=auth.uid())))$$;
revoke all on function public.can_view_slot(uuid) from public;grant execute on function public.can_view_slot(uuid) to authenticated;
create policy slots_directory on public.counselor_slots as restrictive for select to authenticated using(counselor_id=auth.uid() or public.can_view_slot(id));
create function public.respect_notification_preference() returns trigger language plpgsql security definer set search_path='' as $$begin
 if exists(select 1 from public.notification_preferences where user_id=new.user_id and not in_app) then return null;end if;return new;end;$$;
create trigger notification_preference before insert on public.notifications for each row execute function public.respect_notification_preference();
revoke all on function public.respect_notification_preference() from public;
commit;
