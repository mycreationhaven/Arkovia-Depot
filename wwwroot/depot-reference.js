(()=>{
  const toggle=document.getElementById('mobileNavToggle');
  const nav=document.getElementById('mainNav');
  if(toggle&&nav){
    toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
    nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}});
  }
  const topSearch=document.querySelector('[data-search-jump]');
  const marketSearch=document.getElementById('marketSearch');
  if(topSearch&&marketSearch){topSearch.addEventListener('input',()=>{marketSearch.value=topSearch.value;marketSearch.dispatchEvent(new Event('input',{bubbles:true}));});topSearch.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('market')?.scrollIntoView({behavior:'smooth'});marketSearch.focus();}});}
})();
