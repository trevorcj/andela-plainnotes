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
