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
