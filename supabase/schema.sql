-- SponsorMatch AI: run in a NEW Supabase project's SQL Editor.
-- This schema is intended for a university prototype. Review before real-world use.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Member' check (char_length(display_name) between 2 and 100),
  role text not null check (role in ('club','sponsor')),
  created_at timestamptz not null default now()
);
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.admin_users where user_id=(select auth.uid())); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
declare selected_role text;
begin
  selected_role := coalesce(new.raw_user_meta_data ->> 'role','club');
  if selected_role not in ('club','sponsor') then selected_role := 'club'; end if;
  insert into public.profiles (id,display_name,role) values
    (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'),''),'Member'),100), selected_role);
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.organizations(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check(kind in('club','sponsor')),
 name text not null check(char_length(name) between 2 and 120),
 location text not null check(char_length(location) between 2 and 100),
 category text not null check(char_length(category) between 2 and 100),
 description text not null default '' check(char_length(description)<=1200),
 budget numeric(12,2) not null default 0 check(budget>=0 and budget<=100000000),
 interests text[] not null default '{}',
 created_at timestamptz not null default now()
);
create index if not exists idx_org_owner on public.organizations(owner_id);
create table if not exists public.org_verifications(
 org_id uuid primary key references public.organizations(id) on delete cascade,
 status text not null default 'pending' check(status in('pending','approved','rejected')),
 reviewed_by uuid references auth.users(id),
 reason text not null default '' check(char_length(reason)<=500),
 updated_at timestamptz not null default now()
);
create or replace function public.handle_new_org()
returns trigger language plpgsql security definer set search_path=''
as $$
begin insert into public.org_verifications(org_id) values (new.id); return new; end; $$;
drop trigger if exists on_org_created on public.organizations;
create trigger on_org_created after insert on public.organizations for each row execute function public.handle_new_org();

create table if not exists public.proposals(
 id uuid primary key default gen_random_uuid(),
 sponsor_org_id uuid not null references public.organizations(id),
 club_org_id uuid not null references public.organizations(id),
 sender_id uuid not null references public.profiles(id),
 amount numeric(12,2) not null check(amount>0 and amount<=100000000),
 message text not null check(char_length(message) between 5 and 2000),
 status text not null default 'draft' check(status in('draft','submitted','accepted','rejected')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (sponsor_org_id <> club_org_id)
);
create index if not exists idx_proposal_sponsor on public.proposals(sponsor_org_id);
create index if not exists idx_proposal_club on public.proposals(club_org_id);

-- Auditing of proposal state transitions is automatic and cannot be inserted by clients.
create table if not exists public.proposal_events(
 id bigint generated always as identity primary key,
 proposal_id uuid not null references public.proposals(id) on delete cascade,
 actor_id uuid references auth.users(id),
 previous_status text,
 new_status text not null,
 occurred_at timestamptz not null default now()
);
create or replace function public.validate_proposal()
returns trigger language plpgsql security definer set search_path=''
as $$
declare sponsor_owner uuid; club_owner uuid; sponsor_kind text; club_kind text;
declare sponsor_approved boolean; club_approved boolean;
begin
  select o.owner_id,o.kind,coalesce(v.status='approved',false)
    into sponsor_owner,sponsor_kind,sponsor_approved from public.organizations o
    left join public.org_verifications v on v.org_id=o.id where o.id=new.sponsor_org_id;
  select o.owner_id,o.kind,coalesce(v.status='approved',false)
    into club_owner,club_kind,club_approved from public.organizations o
    left join public.org_verifications v on v.org_id=o.id where o.id=new.club_org_id;
  if sponsor_kind is distinct from 'sponsor' or club_kind is distinct from 'club' then
    raise exception 'Select a business sponsor and a club';
  end if;
  if tg_op = 'INSERT' then
    if new.sender_id is distinct from (select auth.uid()) or sponsor_owner is distinct from (select auth.uid()) then
      raise exception 'Only the sponsor owner can create proposals';
    end if;
    if new.status not in ('draft','submitted') then raise exception 'Invalid initial status'; end if;
    if new.status='submitted' and not(sponsor_approved and club_approved) then
      raise exception 'Both organisations must be approved before submission';
    end if;
  else
    if (to_jsonb(new)-'status'-'message'-'amount'-'updated_at') is distinct from
       (to_jsonb(old)-'status'-'message'-'amount'-'updated_at') then
      raise exception 'Immutable proposal fields changed';
    end if;
    if sponsor_owner=(select auth.uid()) and old.status='draft'
       and new.status in('draft','submitted') then
      if new.status='submitted' and not(sponsor_approved and club_approved) then
        raise exception 'Both organisations must be approved before submission';
      end if;
    elsif club_owner=(select auth.uid()) and old.status='submitted'
       and new.status in('accepted','rejected')
       and new.message=old.message and new.amount=old.amount then
      null;
    else raise exception 'Not authorised for this status transition'; end if;
  end if;
  new.updated_at:=now();return new;
end; $$;
drop trigger if exists validate_proposal_changes on public.proposals;
create trigger validate_proposal_changes before insert or update on public.proposals
for each row execute function public.validate_proposal();

create or replace function public.log_proposal()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if tg_op='INSERT' or new.status is distinct from old.status then
  insert into public.proposal_events(proposal_id,actor_id,previous_status,new_status)
  values(new.id,(select auth.uid()),case when tg_op='INSERT' then null else old.status end,new.status);
 end if;
 return new;
end; $$;
drop trigger if exists audit_proposal_changes on public.proposals;
create trigger audit_proposal_changes after insert or update on public.proposals
for each row execute function public.log_proposal();

create or replace function public.validate_verification()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if not public.is_admin() then raise exception 'Admin review required'; end if;
 if (new.org_id is distinct from old.org_id) then raise exception 'Organisation cannot change'; end if;
 new.reviewed_by:=(select auth.uid());new.updated_at:=now();
 return new;
end; $$;
drop trigger if exists validate_verification_changes on public.org_verifications;
create trigger validate_verification_changes before update on public.org_verifications
for each row execute function public.validate_verification();

create or replace function public.owns_org(_org_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.organizations where id=_org_id and owner_id=(select auth.uid())); $;
create or replace function public.is_org_approved(_org_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.org_verifications where org_id=_org_id and status='approved'); $$;
revoke all on function public.owns_org(uuid),public.is_org_approved(uuid) from public;
grant execute on function public.owns_org(uuid),public.is_org_approved(uuid) to authenticated;

-- RLS is enforced in the database. Do not disable for application use.
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.organizations enable row level security;
alter table public.org_verifications enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_events enable row level security;

create policy profiles_read on public.profiles for select to authenticated
 using(id=(select auth.uid()) or public.is_admin());
create policy profiles_edit on public.profiles for update to authenticated
 using(id=(select auth.uid())) with check(id=(select auth.uid()));
-- No client policy for admin_users. Membership is granted manually by a database owner.

create policy org_read on public.organizations for select to authenticated
 using(owner_id=(select auth.uid()) or public.is_admin() or
 public.is_org_approved(id));
create policy org_insert on public.organizations for insert to authenticated
 with check(owner_id=(select auth.uid()) and exists(
  select 1 from public.profiles p where p.id=(select auth.uid()) and p.role=kind));
create policy org_edit on public.organizations for update to authenticated
 using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

create policy verify_read on public.org_verifications for select to authenticated
 using(public.is_admin() or status='approved' or public.owns_org(org_id));
create policy verify_admin_update on public.org_verifications for update to authenticated
 using(public.is_admin()) with check(public.is_admin());

create policy proposal_read on public.proposals for select to authenticated
 using(sender_id=(select auth.uid()) or public.is_admin() or exists(
   select 1 from public.organizations o where o.id=club_org_id and o.owner_id=(select auth.uid())));
create policy proposal_insert on public.proposals for insert to authenticated
 with check(sender_id=(select auth.uid()) and exists(
  select 1 from public.organizations o where o.id=sponsor_org_id and o.owner_id=(select auth.uid()) and o.kind='sponsor'));
create policy proposal_update on public.proposals for update to authenticated
 using(sender_id=(select auth.uid()) or public.owns_org(club_org_id))
 with check(sender_id=(select auth.uid()) or public.owns_org(club_org_id));

create policy events_read on public.proposal_events for select to authenticated using(
 public.is_admin() or exists(select 1 from public.proposals p where p.id=proposal_id and
 (p.sender_id=(select auth.uid()) or public.owns_org(p.club_org_id))));

-- Explicit least-privilege grants. Column grants protect immutable owner/kind fields.
revoke all on public.profiles, public.admin_users, public.organizations,
 public.org_verifications, public.proposals, public.proposal_events from anon,authenticated;
grant select on public.profiles to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant select on public.organizations to authenticated;
grant insert(owner_id,kind,name,location,category,description,budget,interests) on public.organizations to authenticated;
grant update(name,location,category,description,budget,interests) on public.organizations to authenticated;
grant select on public.org_verifications to authenticated;
grant update(status,reason) on public.org_verifications to authenticated;
grant select on public.proposals to authenticated;
grant insert(sponsor_org_id,club_org_id,sender_id,amount,message,status) on public.proposals to authenticated;
grant update(message,amount,status) on public.proposals to authenticated;
grant select on public.proposal_events to authenticated;
grant usage,select on sequence public.proposal_events_id_seq to authenticated;

-- After registering your OWN trusted account, appoint one administrator manually:
-- insert into public.admin_users(user_id) values ('YOUR-USER-UUID');
-- NEVER implement admin self-assignment in the browser.
