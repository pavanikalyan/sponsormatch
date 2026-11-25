-- SQL smoke test of real Postgres constraints and RLS. Executed after schema.
\set ON_ERROR_STOP on
-- Seed identities as DB owner (auth.users trigger creates profiles).
insert into auth.users(id,raw_user_meta_data) values
('00000000-0000-4000-8000-000000000001','{"role":"sponsor","display_name":"Sponsor A"}'),
('00000000-0000-4000-8000-000000000002','{"role":"club","display_name":"Club A"}'),
('00000000-0000-4000-8000-000000000003','{"role":"sponsor","display_name":"Sponsor B"}'),
('00000000-0000-4000-8000-000000000004','{"role":"club","display_name":"Club B"}'),
('00000000-0000-4000-8000-000000000005','{"role":"club","display_name":"Admin User"}');
insert into public.admin_users(user_id) values ('00000000-0000-4000-8000-000000000005');
-- create user-owned organisations
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
insert into public.organizations(id,owner_id,kind,name,location,category,description,budget,interests)
values ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','sponsor','Sponsor A Ltd','Sheffield','Sportswear','Test sponsor',5000,array['Football']);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
insert into public.organizations(id,owner_id,kind,name,location,category,description,budget,interests)
values ('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000002','club','Club A FC','Sheffield','Football','Test club',2000,'{}');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
insert into public.organizations(id,owner_id,kind,name,location,category,description,budget,interests)
values ('00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000003','sponsor','Sponsor B Ltd','Leeds','Retail','Test sponsor B',5000,array['Football']);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
insert into public.organizations(id,owner_id,kind,name,location,category,description,budget,interests)
values ('00000000-0000-4000-8000-000000000014','00000000-0000-4000-8000-000000000004','club','Club B FC','Leeds','Football','Test club B',2500,'{}');
-- Pending orgs are not public to other ordinary users.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
do $$ begin
 if exists(select 1 from public.organizations where id='00000000-0000-4000-8000-000000000012') then raise exception 'Pending club visible to sponsor';end if;
end $$;
-- Unauthorised verification update should match zero rows.
update public.org_verifications set status='approved' where org_id='00000000-0000-4000-8000-000000000011';
do $$ begin
 if (select count(*) from public.org_verifications where org_id='00000000-0000-4000-8000-000000000011' and status='approved') > 0 then
 raise exception 'Sponsor self-approved';end if;
end $$;
-- Admin can approve.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000005',false);
update public.org_verifications set status='approved' where org_id in
 ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012');
-- Sponsor A may create a proposal for Club A.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
insert into public.proposals(id,sponsor_org_id,club_org_id,sender_id,amount,message,status)
values('00000000-0000-4000-8000-000000000021',
 '00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012',
 '00000000-0000-4000-8000-000000000001',1200,'Our sponsorship offer for Club A.','submitted');
-- Sponsor is prohibited from accepting their own proposal.
do $$ begin
 begin update public.proposals set status='accepted' where id='00000000-0000-4000-8000-000000000021';
 raise exception 'Sponsor was able to accept';
 exception when others then
 if sqlerrm='Sponsor was able to accept' then raise; end if;
 end;
end $$;
-- Club A can accept.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
update public.proposals set status='accepted' where id='00000000-0000-4000-8000-000000000021';
do $$ begin
 if not exists(select 1 from public.proposals where id='00000000-0000-4000-8000-000000000021' and status='accepted') then
 raise exception 'Club acceptance did not persist';end if;
end $$;
reset role;
do $$ begin
 if (select count(*) from public.proposal_events where proposal_id='00000000-0000-4000-8000-000000000021') < 2 then
 raise exception 'Proposal status audit events missing';end if;
end $$;
select 'Database RLS smoke tests passed' as result;
