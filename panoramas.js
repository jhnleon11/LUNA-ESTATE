/* Panoramas are independent of the photographic background and certificate. */
window.LunaPanoramas = function ({plots, selectPlot, updateCamera, getSelected}) {
  const $ = id => document.getElementById(id);
  const panel=document.querySelector('.map-panel'), camera=$('map-camera'), view=$('panorama-view'), image=$('panorama-image');
  const explorer=document.querySelector('.estate-explorer'), home=explorer.parentNode, placeholder=document.createComment('collection-home');
  explorer.before(placeholder);
  const list=$('plot-list'), listHome=list.parentNode, drawer=$('plot-drawer'), expanded=$('panorama-dialog');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const cache=new Map();
  let token=0, timer=0, position=50, drag=null, lastOpener=null, mode='atlas';
  const caption=p=>p.id==='01'?'Художественная реконструкция места высадки Apollo 11':'Художественная панорама';
  function lock(){document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));}
  function source(p) { return 'assets/panoramas/'+p.id+(innerWidth<600 && !expanded.open?'-small.webp':'-large.webp'); }
  function load(p, retry=false) {
    const url=source(p);
    if(retry) cache.delete(url);
    if(!cache.has(url)) cache.set(url,new Promise((resolve,reject)=>{
      const img=new Image();img.decoding='async';
      img.onload=()=>img.decode().then(()=>resolve(url),reject);
      img.onerror=()=>reject(new Error('Image unavailable'));
      img.src=url;
    }).catch(error=>{cache.delete(url);throw error;}));
    return cache.get(url);
  }
  function status(message,retry=false) {
    $('panorama-status').hidden=!message;
    $('panorama-status').querySelector('span').textContent=message;
    $('panorama-retry').hidden=!retry;
  }
  function showMap() {
    mode='atlas';panel.dataset.view=mode;
    token++;clearTimeout(timer);view.hidden=true;view.classList.remove('visible');view.tabIndex=-1;
    camera.inert=false;camera.removeAttribute('aria-hidden');
    $('mini-atlas').hidden=true;status('');updateCamera(false);
    $('map-zoom').textContent='Приблизить ＋';$('map-zoom').setAttribute('aria-pressed','false');
    $('view-caption').textContent='Схема коллекции · Не географическая карта';
    $('view-title').textContent='Ваша история начинается здесь';
    $('view-help').textContent='Выберите контур или участок из списка';
    $('atlas-sector').textContent='01 — 06';
  }
  function updateMini(p) {
    const mini=$('mini-atlas').querySelector('svg');
    mini.innerHTML=document.querySelector('.plot-map').innerHTML;
    mini.querySelectorAll('g').forEach(g=>{g.removeAttribute('tabindex');g.removeAttribute('role');g.removeAttribute('aria-pressed');g.removeAttribute('aria-label');g.removeAttribute('data-plot');});
  }
  async function choose(p,retry=false) {
    const current=++token;clearTimeout(timer);const started=performance.now();
    if(drawer.open)drawer.close();
    mode='approach';panel.dataset.view=mode;
    view.classList.remove('visible');view.hidden=true;view.tabIndex=-1;
    camera.inert=false;camera.removeAttribute('aria-hidden');
    $('mini-atlas').hidden=true;
    $('atlas-sector').textContent=p.id;
    $('view-title').textContent=p.name;
    $('view-caption').textContent=caption(p);
    $('view-help').textContent='Приближаемся к выбранному месту';
    $('map-zoom').textContent='Весь атлас ↖';$('map-zoom').setAttribute('aria-pressed','true');
    updateCamera(true);status('Открываем панораму…');
    try {
      const url=await load(p,retry);
      if(current!==token)return;
      timer=setTimeout(()=>{
        if(current!==token)return;
        image.src=url;image.alt=caption(p)+' — '+p.name;
        position=p.id==='06'?76:p.id==='01'?55:50;
        image.style.objectPosition=position+'% center';
        view.hidden=false;view.tabIndex=0;
        mode='panorama';panel.dataset.view=mode;
        // A hidden atlas cannot retain keyboard focus.
        const mapHadFocus=camera.contains(document.activeElement);
        camera.inert=true;camera.setAttribute('aria-hidden','true');
        if(mapHadFocus)view.focus({preventScroll:true});
        updateMini(p);$('mini-atlas').hidden=false;status('');
        $('view-help').textContent='Потяните в сторону · ← →';
        requestAnimationFrame(()=>{if(current===token)view.classList.add('visible');});
        const next=plots[(plots.indexOf(p)+1)%plots.length];load(next).catch(()=>{});
      },reduced.matches?0:Math.max(0,600-(performance.now()-started)));
    } catch {
      if(current!==token)return;
      mode='error';panel.dataset.view=mode;
      status('Панорама недоступна. Выбор и оформление работают.',true);
      $('view-caption').textContent='Схема коллекции · '+p.name;
      $('view-help').textContent='Можно повторить загрузку';
    }
  }
  $('map-zoom').addEventListener('click',()=>{if(mode==='atlas')choose(getSelected());else showMap();});
  $('mini-atlas').addEventListener('click',()=>{showMap();$('map-zoom').focus({preventScroll:true});});
  $('panorama-retry').addEventListener('click',()=>choose(getSelected(),true));
  function setPosition(value){position=Math.max(0,Math.min(100,value));image.style.objectPosition=position+'% center';}
  view.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setPosition(position+(e.key==='ArrowRight'?7:-7));}});
  view.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,position};view.setPointerCapture(e.pointerId);});
  view.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dy)>Math.abs(dx)&&e.pointerType==='touch')return;const overflow=Math.max(1,image.naturalWidth*(view.clientHeight/image.naturalHeight)-view.clientWidth);setPosition(drag.position-dx/overflow*100);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>view.addEventListener(type,()=>drag=null));
  $('plot-drawer-open').addEventListener('click',()=>{
    $('drawer-list').append(list);drawer.showModal();lock();$('plot-drawer-open').setAttribute('aria-expanded','true');
    list.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
  });
  $('plot-drawer-close').addEventListener('click',()=>drawer.close());
  drawer.addEventListener('close',()=>{listHome.append(list);$('plot-drawer-open').setAttribute('aria-expanded','false');lock();$('plot-drawer-open').focus({preventScroll:true});});
  drawer.addEventListener('click',e=>{if(e.target===drawer){const r=drawer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right)drawer.close();}});
  $('panorama-expand').addEventListener('click',()=>{
    if(expanded.open){expanded.close();return;}
    lastOpener=document.activeElement;expanded.append(explorer);expanded.showModal();lock();
    $('panorama-expand').textContent='Закрыть ×';$('panorama-expand').focus();
    requestAnimationFrame(()=>{updateCamera(mode!=='atlas');if(mode==='panorama')choose(getSelected());});
  });
  expanded.addEventListener('close',()=>{
    if(drawer.open)drawer.close();
    placeholder.after(explorer);$('panorama-expand').textContent='Развернуть ⤢';lock();
    lastOpener?.focus({preventScroll:true});
    requestAnimationFrame(()=>updateCamera(mode!=='atlas'));
  });
  matchMedia('(min-width:1024px)').addEventListener('change',e=>{if(e.matches&&drawer.open)drawer.close();});
  showMap();
  return {choose};
};
