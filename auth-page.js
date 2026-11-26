(()=>{'use strict';
const $=id=>document.getElementById(id);
const form=$('authPageForm');
if(!form)return;
const register=document.body.dataset.authPage==='register';
const config=window.SPONSORMATCH_CONFIG||{};
const validUrl=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url||'');
const validKey=typeof config.anonKey==='string'&&config.anonKey.length>20;
const client=validUrl&&validKey&&window.supabase?.createClient?
 window.supabase.createClient(config.url,config.anonKey):null;
const submit=$('authPageSubmit'),notice=$('backendMessage'),errorNode=$('authPageError');
const showError=message=>{errorNode.textContent=message||'Something went wrong. Please try again.';};
const setBusy=busy=>{submit.disabled=busy;submit.setAttribute('aria-busy',String(busy));submit.innerHTML=busy?'Please wait…':(register?'Create account <span aria-hidden="true">→</span>':'Log in <span aria-hidden="true">→</span>')};
if(!client){
 notice.hidden=false;
 // Permit a harmless form preview; never accept passwords or submit data without an authenticated backend.
 form.querySelectorAll('input[type="password"],button[type="submit"]').forEach(el=>{el.disabled=true});
} else {
 notice.hidden=true;
 // A signed-in user should not need to sign in again.
 client.auth.getSession().then(({data})=>{
  if(data?.session?.user)location.replace('home.html');
 }).catch(()=>{});
}
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(!client)return;
 if(!form.reportValidity())return;
 const fields=Object.fromEntries(new FormData(form).entries());
 const email=String(fields.email||'').trim().toLowerCase();
 const password=String(fields.password||'');
 if(!email||password.length<8){showError('Enter a valid email and password (at least 8 characters).');return}
 if(register){
  const name=String(fields.displayName||'').trim();
  if(name.length<2){showError('Enter your full name.');$('displayName').focus();return}
  if(password!==fields.confirmPassword){showError('Passwords do not match.');$('confirmPassword').focus();return}
  if(!['club','sponsor'].includes(fields.role)){showError('Choose Club or Sponsor.');return}
 }
 showError('');
 setBusy(true);
 try{
  if(register){
   const redirect=new URL('home.html?auth=confirmed',location.href).href;
   const {data,error}=await client.auth.signUp({
     email,password,
     options:{emailRedirectTo:redirect,data:{role:fields.role,display_name:String(fields.displayName||'').trim()}}
   });
   if(error)throw error;
   if(!data?.user)throw new Error('Registration did not complete. Please retry.');
   // If email confirmation is on, user is not authenticated yet; explain that on the home page.
   location.assign(data.session?'home.html?auth=login':'home.html?auth=registered');
  } else {
   const {data,error}=await client.auth.signInWithPassword({email,password});
   if(error)throw error;
   if(!data?.session)throw new Error('Login did not return a valid session.');
   location.assign('home.html?auth=login');
  }
 }catch(error){showError(error?.message||'Unable to continue.');setBusy(false)}
});
})();
