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
