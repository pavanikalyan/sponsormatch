-- PostgreSQL RLS integration test. Run only in temporary CI database.
\set ON_ERROR_STOP on
create or replace function public.test_assert(value boolean, description text)
returns void language plpgsql as $$
begin if not coalesce(value,false) then raise exception 'RLS test failed: %',description; end if; end; $$;
grant execute on function public.test_assert(boolean,text) to authenticated;

insert into auth.users(id,raw_user_meta_data) values
('00000000-0000-4000-8000-000000000001','{"role":"sponsor","display_name":"Sponsor A"}'),
('00000000-0000-4000-8000-000000000002','{"role":"club","display_name":"Club A"}'),
('00000000-0000-4000-8000-000000000003','{"role":"sponsor","display_name":"Sponsor B"}'),
('00000000-0000-4000-8000-000000000004','{"role":"club","display_name":"Club B"}'),
('00000000-0000-4000-8000-000000000005','{"role":"club","display_name":"Admin User"}');
insert into public.admin_users(user_id) values ('00000000-0000-4000-8000-000000000005');

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
insert into public.organizations(owner_id,kind,name,location,category,description,budget,interests)
values ('00000000-0000-4000-8000-000000000001','sponsor','Sponsor A Ltd','Sheffield','Sportswear','Test sponsor',5000,array['Football']);
select id from public.organizations where name='Sponsor A Ltd' \gset sponsor_a_
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
insert into public.organizations(owner_id,kind,name,location,category,description,budget,interests)
values ('00000000-0000-4000-8000-000000000002','club','Club A FC','Sheffield','Football','Test club',2000,'{}');
select id from public.organizations where name='Club A FC' \gset club_a_
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
insert into public.organizations(owner_id,kind,name,location,category,description,budget,interests)
values ('00000000-0000-4000-8000-000000000003','sponsor','Sponsor B Ltd','Leeds','Retail','Test sponsor B',5000,array['Football']);
select id from public.organizations where name='Sponsor B Ltd' \gset sponsor_b_
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
insert into public.organizations(owner_id,kind,name,location,category,description,budget,interests)
values ('00000000-0000-4000-8000-000000000004','club','Club B FC','Leeds','Football','Test club B',2500,'{}');
select id from public.organizations where name='Club B FC' \gset club_b_

-- Pending organisations are not visible to other users.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
select public.test_assert(
 not exists(select 1 from public.organizations where id=:'club_a_id'::uuid),
 'Pending club should not be publicly visible');
-- Sponsor cannot self-verify.
update public.org_verifications set status='approved' where org_id=:'sponsor_a_id'::uuid;
select public.test_assert(
 not exists(select 1 from public.org_verifications where org_id=:'sponsor_a_id'::uuid and status='approved'),
 'Sponsor self-approved an organisation');

-- Admin reviews and approves.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000005',false);
update public.org_verifications set status='approved' where org_id in (:'sponsor_a_id'::uuid,:'club_a_id'::uuid);
select public.test_assert(
 (select count(*) from public.org_verifications where status='approved')=2,
 'Admin could not approve both organisations');

-- Sponsor A submits a proposal to Club A; database assigns the proposal UUID.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
insert into public.proposals(sponsor_org_id,club_org_id,sender_id,amount,message,status)
values (:'sponsor_a_id'::uuid,:'club_a_id'::uuid,'00000000-0000-4000-8000-000000000001',1200,
'Our sponsorship offer for Club A.','submitted');
select id from public.proposals where sender_id='00000000-0000-4000-8000-000000000001' \gset proposal_
select set_config('test.proposal_id',:'proposal_id',false);
-- Verify database trigger refuses sponsor-only acceptance.
do $$
begin
  begin
    update public.proposals set status='accepted' where id=current_setting('test.proposal_id')::uuid;
    raise exception 'Sponsor was able to accept';
  exception when others then
    if sqlerrm='Sponsor was able to accept' then raise; end if;
  end;
end $$;
-- Unrelated sponsor cannot see the submitted proposal.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
select public.test_assert(not exists(select 1 from public.proposals where id=:'proposal_id'::uuid),
 'Unrelated sponsor viewed private proposal');
-- Club A may accept the submitted proposal.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
update public.proposals set status='accepted' where id=:'proposal_id'::uuid;
select public.test_assert(
 exists(select 1 from public.proposals where id=:'proposal_id'::uuid and status='accepted'),
 'Receiving club could not accept proposal');
-- Club B cannot change another club's accepted proposal.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
update public.proposals set status='rejected' where id=:'proposal_id'::uuid;
select public.test_assert(not exists(select 1 from public.proposals where id=:'proposal_id'::uuid),
 'Unrelated club accessed private proposal');

reset role;
select public.test_assert(
 (select count(*) from public.proposal_events where proposal_id=:'proposal_id'::uuid)>=2,
 'Proposal audit events missing');
select 'All database role and workflow tests passed' as result;
