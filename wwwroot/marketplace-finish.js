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
  function typeKey(value){return String(value||'asset').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'asset';}
  function typeGlyph(value){const t=String(value||'').toLowerCase();if(/pet|companion/.test(t))return '✦';if(/item|terraria|inventory|gear|weapon|armor/.test(t))return '◆';if(/stock|share|security/.test(t))return '♜';if(/collect|token|badge/.test(t))return '✧';return '♛';}
  function marketSkeleton(count=4){return Array.from({length:count},()=>'<article class="card marketplace-card market-skeleton" aria-hidden="true"><div class="skeleton-line short"></div><div class="skeleton-art"></div><div class="skeleton-line"></div><div class="skeleton-line medium"></div><div class="skeleton-button"></div></article>').join('');}
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
    if(!list.length){grid.innerHTML='<div class="empty kingdom-empty"><span class="empty-crest">♛</span><strong>No listings found</strong><p>Try another search or category, or check back when another adventurer opens a stall.</p></div>';return;}
    grid.innerHTML=list.map(l=>{const key=typeKey(l.assetType),glyph=typeGlyph(l.assetType);return `<article class="card marketplace-card asset-${esc(key)}"><div class="market-card-top"><span class="asset-type-badge">${esc(l.assetType)}</span><span class="listing-live-dot"><i></i> Live</span></div><div class="market-item-art" aria-hidden="true"><span>${esc(glyph)}</span><small>${esc(l.assetType)}</small></div><div class="market-card-body"><h3>${esc(l.assetName)}</h3><div class="seller-strip"><span class="seller-avatar">${esc(String(l.sellerName||'A').charAt(0).toUpperCase())}</span><span><small>Offered by</small><strong>${esc(l.sellerName)}</strong></span></div></div><div class="market-price-block"><small>Kingdom price</small><div class="price">${esc(l.price)} <span>${esc(currency)}</span></div></div><div class="actions">${sessionAuthenticated?`<button class="buy-button market-primary" data-id="${esc(l.listingId)}">Buy now</button>`:'<button class="market-signin secondary" type="button">Sign in to buy</button>'}</div></article>`;}).join('');
    grid.querySelectorAll('.buy-button').forEach(b=>b.addEventListener('click',()=>{if(typeof buyListing==='function')buyListing(b.dataset.id,b);}));
    grid.querySelectorAll('.market-signin').forEach(b=>b.addEventListener('click',()=>openWalletLink()));
  }
  async function refreshMarket(){
    await refreshSessionState();
    const grid=$('listingGrid');if(grid)grid.innerHTML=marketSkeleton();
    try{const r=await fetch('/api/listings',{credentials:'same-origin'});if(!r.ok)throw new Error();const d=await r.json();listings=(d.listings||d.Listings||[]).map(normalizeListing);
      const select=$('marketTypeFilter');if(select){const current=select.value;const types=[...new Set(listings.map(x=>x.assetType).filter(Boolean))].sort();select.innerHTML='<option value="all">All asset types</option>'+types.map(t=>`<option value="${esc(String(t).toLowerCase())}">${esc(t)}</option>`).join('');if([...select.options].some(o=>o.value===current))select.value=current;}
      renderMarket();
    }catch{if(grid)grid.innerHTML='<div class="empty kingdom-empty error-empty"><span class="empty-crest">!</span><strong>Marketplace unavailable</strong><p>The Depot could not load listings right now. Refresh the market to try again.</p></div>';}
  }
  function renderExchange(stocks){
    const grid=$('exchangeGrid');if(!grid)return;
    $('exchangeCount').textContent=`${stocks.length} securit${stocks.length===1?'y':'ies'}`;
    if(!stocks.length){grid.innerHTML='<div class="empty kingdom-empty"><span class="empty-crest">♜</span><strong>No securities listed</strong><p>The ARKOVIA Exchange has no active securities available right now.</p></div>';return;}
    grid.innerHTML=stocks.map(s=>{const ticker=s.ticker??s.Ticker??'—',name=s.name??s.Name??ticker,price=s.price??s.Price??'—',available=s.sharesAvailable??s.SharesAvailable??'—',outstanding=s.sharesOutstanding??s.SharesOutstanding??'—';return `<article class="card exchange-card"><div class="market-card-top"><span class="asset-type-badge">${esc(ticker)}</span><span class="listing-live-dot gold"><i></i> Exchange</span></div><div class="exchange-emblem">${esc(String(ticker).slice(0,3))}</div><h3>${esc(name)}</h3><div class="exchange-stat-row"><span><small>Available</small><strong>${esc(available)}</strong></span><span><small>Outstanding</small><strong>${esc(outstanding)}</strong></span></div><div class="market-price-block"><small>Share price</small><div class="price">${esc(price)} <span>${esc(currency)}</span></div></div><div class="actions"><button class="exchange-open${sessionAuthenticated?'':' secondary'}" data-ticker="${esc(ticker)}">${sessionAuthenticated?'View / buy':'Sign in to buy'}</button></div></article>`;}).join('');
    grid.querySelectorAll('.exchange-open').forEach(b=>b.addEventListener('click',()=>{if(!sessionAuthenticated){openWalletLink();return;}if(typeof openStock==='function')openStock(b.dataset.ticker);}));
  }
  async function refreshExchange(){const grid=$('exchangeGrid');if(grid)grid.innerHTML=marketSkeleton();try{const r=await fetch('/api/stocks',{credentials:'same-origin'});if(!r.ok)throw new Error();const d=await r.json();renderExchange(d.stocks||d.Stocks||[]);}catch{if(grid)grid.innerHTML='<div class="empty kingdom-empty error-empty"><span class="empty-crest">!</span><strong>Exchange unavailable</strong><p>The ARKOVIA Exchange could not be loaded right now.</p></div>';}}
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
