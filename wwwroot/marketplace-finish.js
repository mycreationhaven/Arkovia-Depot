(()=>{
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>{const n=Number(String(v??'').replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:0;};
  let listings=[], sessionAuthenticated=false, currency='ARKOS';

  function normalizeListing(l){return{
    listingId:l.listingId??l.ListingId??'',
    assetName:l.assetName??l.AssetName??'Marketplace item',
    assetType:l.assetType??l.AssetType??'Asset',
    sellerName:l.sellerName??l.SellerName??'Adventurer',
    price:l.price??l.Price??'', raw:l
  };}
  async function refreshSessionState(){try{const r=await fetch('/api/session',{credentials:'same-origin'});if(r.ok){const d=await r.json();sessionAuthenticated=!!d.authenticated;}}catch{}}
  async function refreshCurrency(){try{const r=await fetch('/api/status',{credentials:'same-origin'});if(r.ok){const d=await r.json();currency=d.currency||d.Currency||'ARKOS';}}catch{}}
  function renderMarket(){
    const grid=$('listingGrid'); if(!grid)return;
    const q=String($('marketSearch')?.value||'').trim().toLowerCase(), type=$('marketTypeFilter')?.value||'all', sort=$('marketSort')?.value||'default';
    let list=listings.slice();
    if(q)list=list.filter(x=>`${x.assetName} ${x.assetType} ${x.sellerName}`.toLowerCase().includes(q));
    if(type!=='all')list=list.filter(x=>String(x.assetType).toLowerCase()===type.toLowerCase());
    if(sort==='price-asc')list.sort((a,b)=>num(a.price)-num(b.price));
    if(sort==='price-desc')list.sort((a,b)=>num(b.price)-num(a.price));
    if(sort==='name')list.sort((a,b)=>String(a.assetName).localeCompare(String(b.assetName)));
    $('marketCount').textContent=`${list.length} listing${list.length===1?'':'s'}`;
    if(!list.length){grid.innerHTML='<div class="empty">No marketplace listings match those filters.</div>';return;}
    grid.innerHTML=list.map(l=>`<article class="card marketplace-card"><div class="market-card-top"><span class="asset-type-badge">${esc(l.assetType)}</span><span class="seller-name">by ${esc(l.sellerName)}</span></div><h3>${esc(l.assetName)}</h3><div class="price">${esc(l.price)} ${esc(currency)}</div><div class="actions">${sessionAuthenticated?`<button class="buy-button" data-id="${esc(l.listingId)}">Buy now</button>`:'<button class="market-signin secondary" type="button">Sign in to buy</button>'}</div></article>`).join('');
    grid.querySelectorAll('.buy-button').forEach(b=>b.addEventListener('click',()=>{if(typeof buyListing==='function')buyListing(b.dataset.id,b);}));
    grid.querySelectorAll('.market-signin').forEach(b=>b.addEventListener('click',()=>openWalletLink()));
  }
  async function refreshMarket(){
    await refreshSessionState();
    try{const r=await fetch('/api/listings',{credentials:'same-origin'});if(!r.ok)throw new Error();const d=await r.json();listings=(d.listings||d.Listings||[]).map(normalizeListing);
      const select=$('marketTypeFilter');if(select){const current=select.value;const types=[...new Set(listings.map(x=>x.assetType).filter(Boolean))].sort();select.innerHTML='<option value="all">All asset types</option>'+types.map(t=>`<option value="${esc(String(t).toLowerCase())}">${esc(t)}</option>`).join('');if([...select.options].some(o=>o.value===current))select.value=current;}
      renderMarket();
    }catch{const grid=$('listingGrid');if(grid)grid.innerHTML='<div class="empty">Marketplace listings are temporarily unavailable.</div>';}
  }
  function renderExchange(stocks){
    const grid=$('exchangeGrid');if(!grid)return;
    $('exchangeCount').textContent=`${stocks.length} securit${stocks.length===1?'y':'ies'}`;
    if(!stocks.length){grid.innerHTML='<div class="empty">No ARKOVIA securities are listed right now.</div>';return;}
    grid.innerHTML=stocks.map(s=>{const ticker=s.ticker??s.Ticker??'—',name=s.name??s.Name??ticker,price=s.price??s.Price??'—',available=s.sharesAvailable??s.SharesAvailable??'—',outstanding=s.sharesOutstanding??s.SharesOutstanding??'—';return `<article class="card exchange-card"><div class="market-card-top"><span class="asset-type-badge">${esc(ticker)}</span><span class="seller-name">${esc(available)} available</span></div><h3>${esc(name)}</h3><div class="price">${esc(price)} ${esc(currency)}</div><div class="meta">${esc(outstanding)} shares outstanding</div><div class="actions"><button class="exchange-open${sessionAuthenticated?'':' secondary'}" data-ticker="${esc(ticker)}">${sessionAuthenticated?'View / buy':'Sign in to buy'}</button></div></article>`;}).join('');
    grid.querySelectorAll('.exchange-open').forEach(b=>b.addEventListener('click',()=>{if(!sessionAuthenticated){openWalletLink();return;}if(typeof openStock==='function')openStock(b.dataset.ticker);}));
  }
  async function refreshExchange(){try{const r=await fetch('/api/stocks',{credentials:'same-origin'});if(!r.ok)throw new Error();const d=await r.json();renderExchange(d.stocks||d.Stocks||[]);}catch{const grid=$('exchangeGrid');if(grid)grid.innerHTML='<div class="empty">The ARKOVIA Exchange is temporarily unavailable.</div>';}}
  function openWalletLink(){const p=$('linkPanel');p?.classList.remove('hidden');p?.scrollIntoView({behavior:'smooth',block:'center'});$('accountInput')?.focus();}
  function enhanceWikiButtons(root=document){
    root.querySelectorAll?.('.pet-actions a[target="_blank"]').forEach(link=>{
      if(!/wiki/i.test(`${link.textContent} ${link.href}`))return;
      link.textContent='Wiki';
      link.classList.remove('secondary');
      link.classList.add('wiki-button');
      link.setAttribute('aria-label','Open official Terraria Wiki');
      link.setAttribute('title','Open official Terraria Wiki');
    });
  }
  function watchDynamicCards(){
    enhanceWikiButtons();
    const target=$('menagerieCatalog')||document.body;
    const observer=new MutationObserver(mutations=>mutations.forEach(m=>m.addedNodes.forEach(node=>{if(node.nodeType===1){enhanceWikiButtons(node);if(node.matches?.('.pet-actions'))enhanceWikiButtons(node.parentElement||node);}})));
    observer.observe(target,{childList:true,subtree:true});
  }
  function initNav(){const toggle=$('mobileNavToggle'),nav=$('mainNav');if(!toggle||!nav)return;toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open);});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');}));}
  async function init(){
    initNav();watchDynamicCards();await Promise.all([refreshCurrency(),refreshSessionState()]);
    $('marketSearch')?.addEventListener('input',renderMarket);$('marketTypeFilter')?.addEventListener('change',renderMarket);$('marketSort')?.addEventListener('change',renderMarket);
    $('refreshButton')?.addEventListener('click',()=>setTimeout(refreshMarket,100));
    await Promise.all([refreshMarket(),refreshExchange()]);
    setInterval(()=>{refreshMarket();refreshExchange();},60000);
  }
  document.addEventListener('DOMContentLoaded',init);
})();
