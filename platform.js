(()=>{'use strict';
const $=id=>document.getElementById(id), $$=sel=>Array.from(document.querySelectorAll(sel));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'£'+Number(n||0).toLocaleString('en-GB',{maximumFractionDigits:2});
const id=()=>crypto?.randomUUID?.()||'demo-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const seed={orgs:[
{id:'c1',owner_id:'demo-club',kind:'club',name:'Sheffield Youth FC',location:'Sheffield',category:'Football',description:'Grassroots football training and accessible youth participation.',budget:3500,interests:[],verification:'approved'},
{id:'c2',owner_id:'demo-club',kind:'club',name:'Northern Stars Cricket',location:'Sheffield',category:'Cricket',description:'Equipment and coaching opportunities for junior cricketers.',budget:2200,interests:[],verification:'approved'},
{id:'c3',owner_id:'demo-club',kind:'club',name:'Green Futures Club',location:'Manchester',category:'Community',description:'Community planting, clean-up days and neighbourhood gardens.',budget:1800,interests:[],verification:'approved'},
{id:'s1',owner_id:'demo-sponsor',kind:'sponsor',name:'Peak Coffee Co.',location:'Sheffield',category:'Food & Drink',description:'Supports youth sport and inclusive community events.',budget:4000,interests:['Football','Community'],verification:'approved'},
{id:'s2',owner_id:'demo-sponsor',kind:'sponsor',name:'Northline Sports',location:'Leeds',category:'Sportswear',description:'Interested in grassroots sport and youth participation.',budget:6000,interests:['Football','Cricket','Basketball'],verification:'approved'},
{id:'s3',owner_id:'demo-sponsor',kind:'sponsor',name:'Evergreen Markets',location:'Manchester',category:'Retail',description:'Backing environmental and local community initiatives.',budget:2500,interests:['Community','Environment'],verification:'approved'}
],proposals:[{id:'p1',sponsor_org_id:'s1',club_org_id:'c1',sender_id:'demo-sponsor',amount:3000,message:'Support our community tournament and equipment fund.',status:'submitted',created_at:new Date().toISOString()}]};
const clone=x=>JSON.parse(JSON.stringify(x));
function loadDemo(){try{const val=JSON.parse(localStorage.getItem('sponsormatch-demo-v4'));if(val&&Array.isArray(val.orgs)&&Array.isArray(val.proposals))return val}catch{}return clone(seed)}
const conf=window.SPONSORMATCH_CONFIG||{},configured=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(conf.url||'')&&typeof conf.anonKey==='string'&&conf.anonKey.length>20;
const api=configured&&window.supabase?.createClient?window.supabase.createClient(conf.url,conf.anonKey):null;
const st={api,user:null,profile:null,isAdmin:false,persona:'club',page:'dashboard',db:loadDemo(),mode:'demo',editOrg:null,loading:false};
const isLive=()=>st.mode==='live'&&!!st.user;
const currentRole=()=>isLive()?(st.isAdmin?'admin':st.profile?.role||'club'):st.persona;
const rolePages=role=>role==='admin'?['dashboard','directory','proposals','verification','help']:
  ['dashboard','directory','matching','proposals','profile','help'];
const mayAccess=page=>rolePages(currentRole()).includes(page);
const roleIntro={
 club:{eyebrow:'✦ Club / VCSE workspace',title:'Find sponsors for your community.',desc:'Manage your club, discover suitable business sponsors and review sponsorship offers.',cta:'Find business sponsors',target:'directory',guide:'Your club journey',guided:'Build a club profile, find a sponsor, and respond to offers.',featured:'Sponsors that could support you'},
 sponsor:{eyebrow:'✦ Business sponsor workspace',title:'Support communities that matter.',desc:'Discover local clubs, compare compatible causes and submit sponsorship proposals.',cta:'Discover community clubs',target:'directory',guide:'Your sponsor journey',guided:'Set your priorities, discover clubs and send a proposal.',featured:'Community clubs to support'},
 admin:{eyebrow:'✦ Platform management workspace',title:'Build trust in every partnership.',desc:'Review club and sponsor registrations, approve organisations and monitor the sponsorship process.',cta:'Review organisations',target:'verification',guide:'Your administration workflow',guided:'Check applications, manage approvals and oversee proposals.',featured:'Organisations awaiting a decision'}
};
const uid=()=>isLive()?st.user.id:'demo-'+st.persona;
const own=o=>o.owner_id===uid(),canReview=()=>currentRole()==='admin';
const status=o=>o.verification||'pending',approved=o=>status(o)==='approved';
const orgName=key=>st.db.orgs.find(o=>o.id===key)?.name||'Unknown organisation';
const ownOrgs=()=>st.db.orgs.filter(own);
const clubs=()=>st.db.orgs.filter(o=>o.kind==='club'&&(approved(o)||own(o)||canReview()));
const sponsors=()=>st.db.orgs.filter(o=>o.kind==='sponsor'&&(approved(o)||own(o)||canReview()));
const safeNum=x=>Number.isFinite(Number(x))?Number(x):0;
function toast(text,bad=false){const el=$('toast');el.textContent=text;el.style.background=bad?'#9d3e37':'#184b33';el.classList.add('show');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.remove('show'),4500)}
function saveDemo(){if(!isLive())try{localStorage.setItem('sponsormatch-demo-v4',JSON.stringify(st.db))}catch{toast('Browser storage unavailable',true)}}
function nav(page){if(!$(page)||!mayAccess(page))page='dashboard';st.page=page;$$('.view').forEach(v=>v.classList.toggle('active',v.id===page));$$('#nav .nav').forEach(b=>{const active=b.dataset.page===page;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')});$('breadcrumb').textContent=({dashboard:'Dashboard',directory:'Organisations',matching:'Match explorer',proposals:'Proposals',profile:'My organisation',verification:'Verification',help:'About & access'})[page]||page;history.replaceState(null,'','#'+page);closeMenu();renderPage();window.scrollTo({top:0,behavior:'smooth'})}
function closeMenu(){$('sidebar').classList.remove('open');$('backdrop').classList.remove('show');$('menu').setAttribute('aria-expanded','false')}
$('menu').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('backdrop').classList.toggle('show',open);$('menu').setAttribute('aria-expanded',String(open))});
$('backdrop').addEventListener('click',()=>{closeMenu();$('menu').focus()});
window.addEventListener('resize',()=>{if(window.innerWidth>800)closeMenu()});
$('nav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)nav(b.dataset.page)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-goto]');if(b)nav(b.dataset.goto)});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
function showDialog(name){const dlg=$(name);dlg.showModal();setTimeout(()=>dlg.querySelector('input:not([type=hidden]),select')?.focus(),25)}
function score(club,sponsor){const base=40,loc=club.location.trim().toLowerCase()===sponsor.location.trim().toLowerCase()?20:0;
const items=Array.isArray(sponsor.interests)?sponsor.interests:String(sponsor.interests||'').split(',');
const interests=items.some(x=>x.trim().toLowerCase()===club.category.trim().toLowerCase())?25:0;
const budget=safeNum(sponsor.budget)>=safeNum(club.budget)?15:safeNum(sponsor.budget)>=safeNum(club.budget)*.7?7:0;
return {total:base+loc+interests+budget,base,loc,interests,budget}}
function orgCard(o){const icon=o.kind==='club'?'🏟️':'🏢',measure=o.kind==='club'?'Funding goal':'Sponsor budget';
return '<article class="card"><div class="card-head"><span class="round-icon" aria-hidden="true">'+icon+'</span><div><h3>'+esc(o.name)+'</h3><span class="sub">'+esc(o.category)+' · '+esc(o.location)+'</span></div></div><p>'+esc(o.description||'No description yet.')+'</p><span class="badge '+esc(status(o))+'">'+esc(status(o))+'</span><div class="foot"><div><div class="small-label">'+measure+'</div><span class="amount">'+money(o.budget)+'</span></div><span class="sub">'+(o.kind==='club'?'Community club':'Business sponsor')+'</span></div></article>'}
function matchCard(c,s){const m=score(c,s);return '<article class="card"><div class="card-head"><div class="round-icon">🏢</div><div><h3>'+esc(s.name)+'</h3><span class="sub">'+esc(s.location)+' · '+esc(s.category)+'</span></div></div><p>For '+esc(c.name)+'</p><div style="display:flex;align-items:center;justify-content:space-between"><span class="badge">'+(m.total>=80?'Strong fit':m.total>=60?'Potential fit':'Explore further')+'</span><span class="score">'+m.total+'%</span></div><div class="track"><div style="width:'+m.total+'%"></div></div><div class="explanation"><b>Why?</b> Shared interest +'+m.interests+', location +'+m.loc+', budget +'+m.budget+', baseline '+m.base+'. <span class="sub">Illustrative, not a prediction.</span></div><div class="foot"><span class="sub">Available '+money(s.budget)+'</span><button class="btn outline small" data-start-proposal="'+esc(c.id)+'|'+esc(s.id)+'">Create proposal</button></div></article>'}
function renderDashboard(){
 const role=currentRole(), intro=roleIntro[role]||roleIntro.club;
 $('dashboard').querySelector('.eyebrow').textContent=intro.eyebrow;
 $('roleHeroTitle').textContent=intro.title;
 $('roleHeroDesc').textContent=intro.desc;
 $('roleHeroCta').textContent=intro.cta+' →';
 $('roleHeroCta').dataset.goto=intro.target;
 $('roleGuideTitle').textContent=intro.guide;
 $('roleGuideDesc').textContent=intro.guided;
 $('roleFeatureTitle').textContent=intro.featured;
 $('roleFeatureDesc').textContent=role==='admin'?'Pending or recently registered organisations.':'Based on illustrative location, interests and funding criteria.';
 const steps=$$('#dashboard .step');
 const guide=role==='club'?
   [['Complete club profile','Describe your cause, location and funding needs.'],['Discover sponsors','Review compatible businesses and their budgets.'],['Respond to offers','Accept or decline sponsorship proposals sent to you.']]:
   role==='sponsor'?
   [['Create business profile','Add sponsorship priorities, interests and budget.'],['Find suitable clubs','Explore community projects and compare the fit.'],['Send proposals','Draft and submit an offer; track the club’s decision.']]:
   [['Review registrations','Check new club and business information.'],['Verify organisations','Approve or reject pending applications.'],['Oversee proposals','Monitor proposal statuses and audit-trail records.']];
 steps.forEach((node,i)=>{node.querySelector('b').textContent=guide[i][0];node.querySelector('p').textContent=guide[i][1]});
 const orgs=st.db.orgs,visible=st.db.proposals.filter(p=>role==='admin'||(role==='sponsor'?own(st.db.orgs.find(o=>o.id===p.sponsor_org_id)||{}):own(st.db.orgs.find(o=>o.id===p.club_org_id)||{})));
 const cards=role==='club'?[[ownOrgs().length,'My clubs','Managed profiles'],[sponsors().filter(approved).length,'Sponsors','Available'],[visible.length,'Received offers','For my clubs'],[visible.filter(p=>p.status==='accepted').length,'Accepted','Partnerships']]:
 role==='sponsor'?[[ownOrgs().length,'My businesses','Managed profiles'],[clubs().filter(approved).length,'Clubs','Available'],[visible.length,'Sent proposals','In pipeline'],[visible.filter(p=>p.status==='accepted').length,'Accepted','Partnerships']]:
 [[orgs.length,'Organisations','Registered'],[orgs.filter(o=>status(o)==='pending').length,'Pending reviews','Action needed'],[orgs.filter(approved).length,'Approved','Verified'],[st.db.proposals.length,'Proposals','Platform activity']];
 $('stats').innerHTML=cards.map(([value,label,desc])=>'<div class="stat"><span>'+esc(label)+'</span><strong>'+value+'</strong><em>'+esc(desc)+'</em></div>').join('');
 const listed=role==='admin'?orgs.filter(o=>!approved(o)).slice(0,3).map(orgCard):
 role==='sponsor'?clubs().filter(approved).slice(0,3).map(orgCard):
 sponsors().filter(approved).slice(0,3).map(orgCard);
 $('featured').innerHTML=listed.length?listed.join(''):'<div class="empty">No matching organisations here yet.</div>';
 const goButton=document.querySelector('#dashboard .section-head .btn[data-goto]');
 if(goButton){goButton.dataset.goto=role==='admin'?'verification':role==='club'?'directory':'matching';
 goButton.textContent=role==='admin'?'Review applications':role==='club'?'Browse sponsors':'Explore club matches'}
}
function renderDirectory(){
 const role=currentRole(),query=$('search').value.trim().toLowerCase();
 const type=role==='club'?'sponsor':role==='sponsor'?'club':$('kindFilter').value;
 $('kindFilter').hidden=role!=='admin';
 $('directoryDesc').textContent=role==='club'?'Browse businesses offering sponsorship and compare budgets.':role==='sponsor'?'Discover clubs and community causes looking for support.':'View clubs and sponsors, including organisations awaiting review.';
 $('addOrg').hidden=role==='admin';
 $('addOrg').textContent=role==='club'?'+ Create club profile':'+ Add sponsor profile';
 const items=st.db.orgs.filter(o=>(approved(o)||own(o)||canReview())&&(type==='all'||o.kind===type)&&[o.name,o.category,o.location].join(' ').toLowerCase().includes(query));
 $('directoryGrid').innerHTML=items.length?items.map(orgCard).join(''):'<div class="empty">No organisations match the current search.</div>';
}
function renderMatching(){
 const role=currentRole();if(role==='admin')return;
 const current=$('matchClub').value,min=Number($('minimumScore').value);
 const options=role==='sponsor'?ownOrgs().filter(o=>o.kind==='sponsor'):ownOrgs().filter(o=>o.kind==='club');
 // Demo users can explore using a fictional sample when they have not registered an organisation.
 const fallback=role==='sponsor'?sponsors().filter(approved):clubs().filter(approved);
 const choices=options.length?options:fallback;
 $('matchLabel').textContent=role==='sponsor'?'Your business sponsor':'Your community club';
 $('matchingDesc').textContent=role==='sponsor'?'Compare clubs that align with your interests, city and sponsorship budget.':'Explore sponsors that align with your club category, location and funding needs.';
 $('matchClub').innerHTML=choices.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join('');
 $('matchClub').value=choices.some(o=>o.id===current)?current:(choices[0]?.id||'');
 const selected=choices.find(o=>o.id===$('matchClub').value);
 if(!selected){$('matchingGrid').innerHTML='<div class="empty">Create an organisation profile to compare potential matches.</div>';return}
 const list=role==='club'?sponsors().filter(approved).map(o=>({c:selected,s:o})):clubs().filter(approved).map(o=>({c:o,s:selected}));
 const results=list.map(v=>({...v,m:score(v.c,v.s)})).filter(v=>v.m.total>=min).sort((a,b)=>b.m.total-a.m.total);
 $('matchingGrid').innerHTML=results.length?results.map(({c,s,m})=>{
 if(role==='club'){let html=matchCard(c,s);return html.replace(/<button class="btn outline small" data-start-proposal="[^"]+">Create proposal<\/button>/,'<span class="sub">Sponsor can send an offer</span>')}
 return '<article class="card"><div class="card-head"><span class="round-icon">🏟️</span><div><h3>'+esc(c.name)+'</h3><span class="sub">'+esc(c.location)+' · '+esc(c.category)+'</span></div></div><p>'+esc(c.description||'Community club')+'</p><div class="foot"><span class="badge">'+(m.total>=80?'Strong fit':'Potential fit')+'</span><span class="score">'+m.total+'%</span></div><div class="track"><div style="width:'+m.total+'%"></div></div><div class="explanation"><b>Why this match?</b> Cause +'+m.interests+', same city +'+m.loc+', budget +'+m.budget+', baseline '+m.base+'. This is a rule-based score, not a prediction.</div><div class="foot"><span class="sub">Funding goal '+money(c.budget)+'</span><button class="btn outline small" data-start-proposal="'+esc(c.id)+'|'+esc(s.id)+'">Create proposal</button></div></article>';
 }).join(''):'<div class="empty">No potential matches meet this threshold.</div>';
}
function renderProposals(){const role=currentRole();$('proposalNotice').hidden=true;$('proposalDesc').textContent=role==='admin'?'Monitor all proposal statuses, without changing club or sponsor decisions.':role==='club'?'View offers to your clubs and accept or decline submitted proposals.':'Draft sponsorship offers, submit them and see clubs’ decisions.';
$('addProposal').disabled=role!=='sponsor';$('addProposal').title=role==='sponsor'?'Create a new proposal':'Sign in as a sponsor to create proposals';
const ps=st.db.proposals.filter(p=>role==='admin'||(role==='sponsor'?own(st.db.orgs.find(o=>o.id===p.sponsor_org_id)||{}):own(st.db.orgs.find(o=>o.id===p.club_org_id)||{}))).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
$('proposalList').innerHTML=ps.length?ps.map(p=>{const sponsor=st.db.orgs.find(o=>o.id===p.sponsor_org_id),club=st.db.orgs.find(o=>o.id===p.club_org_id);
const sponsorCan=role==='sponsor'&&sponsor&&own(sponsor)&&p.status==='draft',clubCan=role==='club'&&club&&own(club)&&p.status==='submitted';
return '<div class="list-row"><span class="round-icon">▤</span><div class="grow"><b>'+esc(orgName(p.sponsor_org_id))+' → '+esc(orgName(p.club_org_id))+'</b><p>'+esc(p.message)+' · '+money(p.amount)+'</p><span class="badge '+(p.status==='accepted'?'approved':p.status==='rejected'?'rejected':p.status==='submitted'?'pending':'')+'">'+esc(p.status)+'</span></div><div class="controls">'+(sponsorCan?'<button class="btn small" data-pstatus="'+esc(p.id)+'|submitted">Submit</button>':'')+(clubCan?'<button class="btn small" data-pstatus="'+esc(p.id)+'|accepted">Accept</button><button class="btn danger small" data-pstatus="'+esc(p.id)+'|rejected">Decline</button>':'')+'</div></div>'}).join(''):'<div class="empty">No proposals yet. Sponsors can create one from this page.</div>'}
function renderProfile(){const orgs=ownOrgs(),role=currentRole();$('profileAddOrg').disabled=!['club','sponsor'].includes(role);$('myOrg').innerHTML='<h3>'+(['club','sponsor'].includes(role)?'Your '+(role==='club'?'club':'business'):'Your profile')+'</h3>'+(orgs.length?orgs.map(o=>'<div class="list-row"><div class="grow"><b>'+esc(o.name)+'</b><p>'+esc(o.location)+' · '+esc(o.category)+'</p><span class="badge '+esc(status(o))+'">'+esc(status(o))+'</span></div><button class="btn outline small" data-edit-org="'+esc(o.id)+'">Edit</button></div>').join(''):'<p>You have not created an organisation yet. Use the button to create one.</p>')+(isLive()?'<p class="help">Signed in as '+esc(st.user.email||'')+'</p>':'<p class="help">Demo persona: '+esc(role)+'. No real login required.</p>')}
function renderVerifications(){if(!canReview()){$('verificationList').innerHTML='<div class="empty">Administrator access required.</div>';return}
const pending=st.db.orgs.filter(o=>!approved(o));$('verificationList').innerHTML=pending.length?pending.map(o=>'<div class="list-row"><span class="round-icon">'+(o.kind==='club'?'🏟️':'🏢')+'</span><div class="grow"><b>'+esc(o.name)+'</b><p>'+esc(o.location)+' · '+esc(o.kind)+' · '+esc(o.description||'No description')+'</p><span class="badge '+esc(status(o))+'">'+esc(status(o))+'</span></div><div class="controls"><button class="btn small" data-verify="'+esc(o.id)+'|approved">Approve</button><button class="btn danger small" data-verify="'+esc(o.id)+'|rejected">Reject</button></div></div>').join(''):'<div class="empty">No organisations currently require review.</div>'}
function renderPage(){if(st.page==='dashboard')renderDashboard();if(st.page==='directory')renderDirectory();if(st.page==='matching')renderMatching();if(st.page==='proposals')renderProposals();if(st.page==='profile')renderProfile();if(st.page==='verification')renderVerifications()}
function render(){
 const role=currentRole(),allowed=rolePages(role);
 $('demoRole').hidden=isLive();
 $('accountBadge').hidden=!isLive();
 $('accountBadge').textContent=isLive()?(st.profile?.display_name||st.user.email||'Member')+' · '+(st.isAdmin?'Admin':st.profile?.role||'Member'):'';
 $('authOpen').hidden=isLive();
 $('registerOpen').hidden=isLive();
 $('logout').hidden=!isLive();
 $$('#nav .nav').forEach(b=>{b.hidden=!allowed.includes(b.dataset.page)});
 $('exportDemo').disabled=isLive();$('resetDemo').disabled=isLive();
 if(!allowed.includes(st.page))st.page='dashboard';
 // Dashboard and other components reflect the active role; hidden sections are inaccessible via navigation.
 renderDashboard();renderPage();
 $$('.view').forEach(v=>v.classList.toggle('active',v.id===st.page));
 $$('#nav .nav').forEach(b=>{const active=b.dataset.page===st.page;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')});
 $('breadcrumb').textContent=({dashboard:'Dashboard',directory:'Organisations',matching:'Match explorer',proposals:'Proposals',profile:'My organisation',verification:'Verification',help:'About & access'})[st.page]||'Dashboard';
}
async function refresh(){if(!api)return;try{st.loading=true;const {data:{session},error:sessionError}=await api.auth.getSession();if(sessionError)throw sessionError;const user=session?.user||null;st.user=user;if(!user){st.mode='demo';st.profile=null;st.isAdmin=false;st.db=loadDemo();render();return}
const [pr,ad,og,vr,pp]=await Promise.all([
api.from('profiles').select('id,display_name,role').eq('id',user.id).single(),
api.rpc('is_admin'),
api.from('organizations').select('id,owner_id,kind,name,location,category,description,budget,interests,created_at'),
api.from('org_verifications').select('org_id,status,reason'),
api.from('proposals').select('id,sponsor_org_id,club_org_id,sender_id,amount,message,status,created_at,updated_at')
]);for(const result of [pr,ad,og,vr,pp])if(result.error)throw result.error;
st.profile=pr.data;st.isAdmin=ad.data===true;const statuses=Object.fromEntries((vr.data||[]).map(v=>[v.org_id,v.status]));
st.db={orgs:(og.data||[]).map(o=>({...o,verification:statuses[o.id]||'pending'})),proposals:pp.data||[]};st.mode='live';render();
}catch(e){toast('Connected data could not load: '+(e.message||e),true)}finally{st.loading=false}}
$('logout').addEventListener('click',async()=>{if(!api)return;const r=await api.auth.signOut();if(r.error)toast(r.error.message,true);else{st.user=null;st.mode='demo';st.persona='club';$('demoRole').value='club';st.db=loadDemo();nav('dashboard');render();toast('Signed out')}});
$('demoRole').addEventListener('change',e=>{st.persona=e.target.value;render();nav('dashboard')});
$('search').addEventListener('input',renderDirectory);$('kindFilter').addEventListener('change',renderDirectory);$('matchClub').addEventListener('change',renderMatching);$('minimumScore').addEventListener('change',renderMatching);
function openOrg(o=null){const role=currentRole();if(!['club','sponsor'].includes(role)){toast('Choose a Club or Sponsor account to manage an organisation',true);return}
st.editOrg=o?.id||null;$('orgTitle').textContent=o?'Edit organisation':'Create '+(role==='club'?'club':'business')+' profile';$('orgForm').reset();$('orgError').textContent='';for(const key of ['name','location','category','budget','description'])$('orgForm').elements.namedItem(key).value=o?.[key]??(key==='budget'?0:key==='category'?'Football':'');$('orgInterests').value=Array.isArray(o?.interests)?o.interests.join(', '):'';showDialog('orgDialog')}
$('addOrg').addEventListener('click',()=>openOrg());$('profileAddOrg').addEventListener('click',()=>openOrg());
document.addEventListener('click',e=>{const b=e.target.closest('[data-edit-org]');if(b){const o=st.db.orgs.find(x=>x.id===b.dataset.editOrg);if(o&&own(o))openOrg(o)}});
$('orgForm').addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());const role=currentRole(),budget=Number(d.budget);const interests=d.interests.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);
if(!['club','sponsor'].includes(role)||!Number.isFinite(budget)||budget<0||budget>100000000){$('orgError').textContent='Invalid role or funding amount';return}
const payload={name:d.name.trim(),location:d.location.trim(),category:d.category,description:d.description.trim(),budget,interests};
if(payload.name.length<2||payload.location.length<2){$('orgError').textContent='Complete organisation name and city';return}
try{if(isLive()){let result;if(st.editOrg)result=await api.from('organizations').update(payload).eq('id',st.editOrg).select('id').single();else result=await api.from('organizations').insert({...payload,owner_id:uid(),kind:role}).select('id').single();if(result.error)throw result.error;await refresh()}
else{if(st.editOrg){const o=st.db.orgs.find(o=>o.id===st.editOrg);if(o&&own(o))Object.assign(o,payload)}else st.db.orgs.push({...payload,id:id(),owner_id:uid(),kind:role,verification:'pending'});saveDemo();render()}
$('orgDialog').close();toast('Organisation saved'+(st.editOrg?'':' — pending verification'));nav('profile')
}catch(err){$('orgError').textContent=err.message||'Could not save organisation'}});
function openProposal(cid='',sid=''){if(currentRole()!=='sponsor'){toast('Only sponsor accounts create proposals. Select Sponsor in demo mode or sign in.',true);return}
const ss=ownOrgs().filter(o=>o.kind==='sponsor'),cs=clubs().filter(approved);
$('proposalSponsor').innerHTML=ss.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+' ('+esc(status(o))+')</option>').join('');
$('proposalClub').innerHTML=cs.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join('');
if(!ss.length||!cs.length){toast('Create a sponsor profile and ensure an approved club is available.',true);nav('profile');return}
$('proposalForm').reset();$('proposalError').textContent='';if(ss.some(o=>o.id===sid))$('proposalSponsor').value=sid;if(cs.some(o=>o.id===cid))$('proposalClub').value=cid;showDialog('proposalDialog')}
$('addProposal').addEventListener('click',()=>openProposal());
document.addEventListener('click',e=>{const b=e.target.closest('[data-start-proposal]');if(b){const [cid,sid]=b.dataset.startProposal.split('|');openProposal(cid,sid)}});
$('proposalForm').addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());const intent=e.submitter?.value||'draft',s=st.db.orgs.find(o=>o.id===d.sponsor_org_id),c=st.db.orgs.find(o=>o.id===d.club_org_id),amount=Number(d.amount);
if(!s||!c||!own(s)||currentRole()!=='sponsor'||!Number.isFinite(amount)||amount<=0||d.message.trim().length<5){$('proposalError').textContent='Check your sponsor, club, amount and message';return}
if(intent==='submitted'&&(!approved(s)||!approved(c))){$('proposalError').textContent='Both organisations must be approved before submitting. You can save a draft.';return}
const payload={sponsor_org_id:s.id,club_org_id:c.id,sender_id:uid(),amount,message:d.message.trim(),status:intent};
try{if(isLive()){const res=await api.from('proposals').insert(payload).select('id').single();if(res.error)throw res.error;await refresh()}
else{st.db.proposals.push({...payload,id:id(),created_at:new Date().toISOString()});saveDemo();render()}
$('proposalDialog').close();toast(intent==='draft'?'Proposal draft saved':'Proposal submitted');nav('proposals')
}catch(err){$('proposalError').textContent=err.message||'Unable to save proposal'}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-pstatus]');if(!b)return;const [key,next]=b.dataset.pstatus.split('|'),p=st.db.proposals.find(p=>p.id===key),role=currentRole();if(!p)return;
const s=st.db.orgs.find(o=>o.id===p.sponsor_org_id),c=st.db.orgs.find(o=>o.id===p.club_org_id);
const valid=next==='submitted'?role==='sponsor'&&own(s)&&p.status==='draft'&&approved(s)&&approved(c):role==='club'&&own(c)&&p.status==='submitted'&&['accepted','rejected'].includes(next);
if(!valid){toast('This transition is not permitted for your role or verification status.',true);return}
try{if(isLive()){const res=await api.from('proposals').update({status:next}).eq('id',key).select('id').single();if(res.error)throw res.error;await refresh()}else{p.status=next;saveDemo();render()}toast('Proposal '+next)}
catch(err){toast(err.message||'Could not update proposal',true)}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-verify]');if(!b)return;const [key,next]=b.dataset.verify.split('|');if(!canReview()){toast('Administrator permission required',true);return}
const o=st.db.orgs.find(o=>o.id===key);if(!o)return;const reason=next==='rejected'?prompt('Reason for rejection (visible to the organisation owner):','Please provide evidence to complete verification.'):'Approved after organisation review';if(reason===null)return;
try{if(isLive()){const result=await api.from('org_verifications').update({status:next,reason:String(reason).slice(0,500)}).eq('org_id',key).select('org_id').single();if(result.error)throw result.error;await refresh()}else{o.verification=next;saveDemo();render()}toast('Organisation '+next)}
catch(err){toast(err.message||'Verification failed',true)}});
$('exportDemo').addEventListener('click',()=>{if(isLive()){toast('Export is only available for local demo data',true);return}
const blob=new Blob([JSON.stringify({format:'sponsormatch-demo-v4',exportedAt:new Date().toISOString(),data:st.db},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sponsormatch-demo.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Demo records exported')});
$('resetDemo').addEventListener('click',()=>{if(isLive())return;if(!confirm('Reset this device to the fictional sample records?'))return;st.db=clone(seed);saveDemo();render();toast('Demo reset')});

const params=new URLSearchParams(location.search);
const authStatus=params.get('auth');
if(authStatus==='registered'){toast('Registration submitted. Check your email to confirm your account before logging in.');history.replaceState(null,'',location.pathname+location.hash)}
else if(authStatus==='login'){toast('Logged in successfully. Welcome to SponsorMatch!');history.replaceState(null,'',location.pathname+location.hash)}
else if(authStatus==='confirmed'){toast('Email confirmed. You can now log in.');history.replaceState(null,'',location.pathname+location.hash)}
async function init(){if(api){api.auth.onAuthStateChange(()=>setTimeout(refresh,0));await refresh()}else{st.mode='demo';render()}
const hash=location.hash.slice(1);nav(['dashboard','directory','matching','proposals','profile','verification','help'].includes(hash)?hash:'dashboard');
}
init();
})();