
/* SponsorMatch AI V3 — progressive UX enhancements.
   No backend/auth: reviewer roles and permissions are demo-only UI simulations. */
(()=>{
'use strict';
const root=document.querySelector('.workspace'), top=document.querySelector('.top');
if(!root||!top||typeof render!=='function')return;
const $id=id=>document.getElementById(id);
const escapeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let persona='explore';
let lastFocus=null;
const notice=document.createElement('section');
notice.className='notice';notice.setAttribute('aria-label','Prototype information');
notice.innerHTML='<strong>University demonstration · Sample data</strong><p>This is an interactive prototype. Changes are saved only on this device; other visitors cannot see your entries. There are no live user accounts, payments or AI integrations. Please do not enter sensitive information.</p>';
const overview=$id('overview');
overview?.insertBefore(notice,overview.firstChild);
const guide=document.createElement('section');
guide.id='upgradeHelp';guide.setAttribute('aria-label','Getting started');
guide.innerHTML='<div class="section-head"><div><h2>How SponsorMatch works</h2><p>Explore the core sponsorship journey in three steps.</p></div></div><div class="guide-cards"><div class="guide-card"><span class="step">01</span><div><b>Discover organisations</b><p>Explore example clubs and business sponsors in the UK.</p></div></div><div class="guide-card"><span class="step">02</span><div><b>Compare matches</b><p>See transparent scores based on location, cause and budget.</p></div></div><div class="guide-card"><span class="step">03</span><div><b>Prepare a proposal</b><p>Create a draft and explore the simulated review process.</p></div></div></div>';
const stats=$id('stats');stats?.parentNode?.insertBefore(guide,stats);
const controls=document.createElement('div');controls.className='demo-controls';controls.setAttribute('aria-label','Prototype controls');
controls.innerHTML='<label for="demoPersona">Explore as</label><select id="demoPersona" aria-label="Choose demonstration perspective"><option value="explore">Visitor</option><option value="club">Club representative</option><option value="sponsor">Business sponsor</option><option value="reviewer">Reviewer demo</option></select><button id="downloadData" class="action-small" type="button" title="Export browser-local demo data">Export data</button><button id="resetData" class="action-small danger" type="button" title="Restore sample data">Reset demo</button>';
top.appendChild(controls);
const heading=$id('matches')?.querySelector('.page-title p');if(heading)heading.textContent='Illustrative rule-based scores using location, interests and funding compatibility.';
const studioTitle=$id('studio')?.querySelector('.page-title h1');if(studioTitle)studioTitle.textContent='Campaign brief studio';
const studioDesc=$id('studio')?.querySelector('.page-title p');if(studioDesc)studioDesc.textContent='Create a structured campaign brief using editable templates (not a live AI service).';
const crumb=$id('breadcrumb');if(crumb)crumb.parentElement?.setAttribute('aria-label','Current section');
const nav=$id('navigation');nav?.setAttribute('aria-label','Main sections');
document.querySelectorAll('#navigation .nav').forEach(b=>{b.setAttribute('type','button');b.setAttribute('aria-current',b.classList.contains('active')?'page':'false')});
document.querySelectorAll('input:not([aria-label])').forEach(el=>{if(!el.labels?.length)el.setAttribute('aria-label',el.placeholder||el.id||'Input field')});
document.querySelectorAll('select:not([aria-label])').forEach(el=>{if(!el.labels?.length)el.setAttribute('aria-label',el.id||'Select an option')});
const mobile=$id('menu'),sidebar=$id('sidebar'),backdrop=document.createElement('div');
backdrop.id='mobileBackdrop';document.body.appendChild(backdrop);
mobile?.setAttribute('aria-label','Open navigation menu');mobile?.setAttribute('aria-controls','sidebar');
function updateMobile(){const open=sidebar?.classList.contains('open');backdrop.classList.toggle('show',!!open);mobile?.setAttribute('aria-expanded',String(!!open));if(mobile)mobile.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu')}
mobile?.addEventListener('click',()=>requestAnimationFrame(updateMobile));
backdrop.addEventListener('click',()=>{sidebar?.classList.remove('open');updateMobile();mobile?.focus()});
nav?.addEventListener('click',()=>requestAnimationFrame(()=>{updateMobile();document.querySelectorAll('#navigation .nav').forEach(b=>b.setAttribute('aria-current',b.classList.contains('active')?'page':'false'))}));
window.addEventListener('resize',()=>{if(window.innerWidth>800){sidebar?.classList.remove('open');updateMobile()}});
const footer=document.createElement('footer');footer.className='upgrade-footer';
footer.innerHTML='<span>SponsorMatch AI · Educational prototype · Fictional organisations</span><span>Data stays in this browser · <a href="https://github.com/pavanikalyan/sponsormatch" target="_blank" rel="noopener noreferrer">Project source</a></span>';
root.appendChild(footer);
const originalMatchCard=matchCard;
matchCard=function(c,s){const html=originalMatchCard(c,s);return html.replace('</article>','<div class="score-explain">Compatibility is illustrative, not AI-generated.</div><button type="button" class="action-small" data-score-info="'+escapeText(c.id)+'|'+escapeText(s.id)+'">Why this match?</button></article>')};
const detail=document.createElement('dialog');detail.id='detailDialog';
detail.innerHTML='<h2 id="detailHeading">Understanding the score</h2><div id="detailContent"></div><div class="row"><span class="sub">The weights are illustrative, not statistically validated.</span><button class="btn" type="button" id="closeDetail">Close</button></div>';
document.body.appendChild(detail);$id('closeDetail').addEventListener('click',()=>detail.close());
detail.addEventListener('click',e=>{if(e.target===detail)detail.close()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-score-info]');if(!b)return;const [ci,si]=b.dataset.scoreInfo.split('|');const c=db.clubs.find(x=>x.id===ci),s=db.sponsors.find(x=>x.id===si);if(!c||!s)return;const loc=c.location.toLowerCase()===s.location.toLowerCase(),interest=s.interests.toLowerCase().split(',').some(x=>x.trim()===c.type.toLowerCase()),budget=s.budget>=c.need?10:s.budget>=c.need*.7?5:0;const rows=[['Base compatibility','40 points'],['Same city',loc?'+27 points':'+0 points'],['Matching cause',interest?'+23 points':'+0 points'],['Budget alignment','+'+budget+' points']];$id('detailContent').innerHTML='<p><b>'+escapeText(c.name)+'</b> and <b>'+escapeText(s.name)+'</b> have a demo score of <b>'+score(c,s)+'%</b>.</p><ul>'+rows.map(r=>'<li>'+r[0]+': '+r[1]+'</li>').join('')+'</ul><p>Use this as an explanation of the prototype matching rules; it is not a prediction that the partnership will succeed.</p>';detail.showModal()});
const originalRender=render;
render=function(){originalRender();document.querySelectorAll('[data-status]').forEach(el=>{el.disabled=persona!=='reviewer';el.title=persona==='reviewer'?'Reviewer simulation: update the demo proposal':'Switch to Reviewer demo to change proposal status'});document.querySelectorAll('[data-go],.nav').forEach(b=>{if(b.dataset.go||b.dataset.view)b.setAttribute('type','button')})};
function personaChange(){persona=$id('demoPersona').value;document.querySelectorAll('[data-status]').forEach(el=>{el.disabled=persona!=='reviewer';el.title=persona==='reviewer'?'Reviewer simulation: update the demo proposal':'Switch to Reviewer demo to change proposal status'});const msg=persona==='reviewer'?'Reviewer is a simulation only: there is no real admin login.':persona==='club'?'Explore how clubs find sponsors and create proposals.':persona==='sponsor'?'Explore how businesses discover clubs and propose partnerships.':'Explore all public demo sections.';notice.querySelector('p').textContent='This is an interactive educational prototype. '+msg+' Changes are stored only in this browser and are not shared. Do not enter personal data.';}
$id('demoPersona').addEventListener('change',personaChange);
document.addEventListener('change',e=>{if(e.target.matches('[data-status]')&&persona!=='reviewer'){e.stopImmediatePropagation();e.target.value='Draft';toast('Choose Reviewer demo to change proposal statuses')}},true);
$id('downloadData').addEventListener('click',()=>{const payload={format:'sponsormatch-v3-demo',exportedAt:new Date().toISOString(),data:db};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sponsormatch-demo-data.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Demo data exported')});
$id('resetData').addEventListener('click',()=>{if(!confirm('Reset this browser to the original fictional demo organisations? All locally created entries and changes will be lost.'))return;try{localStorage.removeItem('sponsormatch-v3');db=structuredClone(seed);render();toast('Demo data reset')}catch{toast('Could not reset demo data')}});
const wrap=$id('modalwrap'),modal=$id('modalform'),close=$id('closeModal');
wrap?.setAttribute('role','presentation');
const modalPanel=wrap?.querySelector('.modal');modalPanel?.setAttribute('role','dialog');modalPanel?.setAttribute('aria-modal','true');modalPanel?.setAttribute('aria-labelledby','modalTitle');modalPanel?.setAttribute('tabindex','-1');
document.addEventListener('click',e=>{if(e.target.closest('[data-modal],[data-propose]'))lastFocus=e.target.closest('button')},true);
close?.addEventListener('click',()=>lastFocus?.focus());wrap?.addEventListener('click',e=>{if(e.target===wrap)lastFocus?.focus()});
document.addEventListener('keydown',e=>{if(!wrap?.classList.contains('show'))return;if(e.key==='Tab'){const elements=Array.from(modalPanel.querySelectorAll('button,input,select,textarea')).filter(x=>!x.disabled&&x.offsetParent!==null);if(!elements.length)return;const first=elements[0],last=elements[elements.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}else if(e.key==='Escape'){lastFocus?.focus()}});
modal?.addEventListener('submit',e=>{const get=n=>modal.elements.namedItem(n)?.value?.trim()||'';const kind=modalKind;const amount=Number(get(kind==='club'?'need':kind==='sponsor'?'budget':'amount'));if(!Number.isFinite(amount)||amount<=0||amount>100000000){e.preventDefault();e.stopImmediatePropagation();toast('Enter a valid positive funding amount');modal.elements.namedItem(kind==='club'?'need':kind==='sponsor'?'budget':'amount')?.focus();return}const fields=kind==='club'?['name','type','location','description']:kind==='sponsor'?['name','industry','location','interests']:['message'];for(const key of fields){const val=get(key);if(val.length<2||val.length>500){e.preventDefault();e.stopImmediatePropagation();toast('Please complete '+key+' (2–500 characters)');modal.elements.namedItem(key)?.focus();return}}},true);
const originalGo=go;
go=function(view){originalGo(view);document.querySelectorAll('#navigation .nav').forEach(b=>b.setAttribute('aria-current',b.classList.contains('active')?'page':'false'));updateMobile();if(location.hash!=='#'+view)history.replaceState(null,'','#'+view)};
const allowed=['overview','discover','sponsors','matches','proposals','studio'];
const initial=decodeURIComponent(location.hash.slice(1));if(allowed.includes(initial))go(initial);
render();personaChange();
})();
