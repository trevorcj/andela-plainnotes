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
