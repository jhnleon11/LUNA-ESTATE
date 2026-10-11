/* Panoramas and cinema share selection, but do not control the background scene. */
window.LunaPanoramas = function ({plots, selectPlot, getSelected}) {
  const $=id=>document.getElementById(id), panel=document.querySelector('.map-panel'),view=$('panorama-view');
  const images=[$('panorama-image'),$('panorama-image').cloneNode()];images[1].id='panorama-next';images[1].removeAttribute('src');images[1].classList.remove('active');images[1].setAttribute('aria-hidden','true');view.append(images[1]);
  const list=$('plot-list'),listHome=list.parentNode,drawer=$('plot-drawer'),cinema=$('panorama-dialog');
  const cinemaImages=[$('cinema-image'),$('cinema-image').cloneNode()];cinemaImages[1].id='cinema-next';document.querySelector('.cinema-stage').prepend(cinemaImages[1]);let cinemaActive=0,cinemaShown=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),cache=new Map(),visited=new Set(),positions=new Map();
  let activity=0,token=0,timer=0,frame=0,cinemaToken=0,active=0,shown=plots[0],drag=null,lastOpener=null;
  const caption=p=>p.id==='01'?'Художественная реконструкция места высадки Apollo 11':'Художественная панорама';
  const focal=p=>p.id==='06'?76:p.id==='01'?55:50;
  const source=(p,large=false)=>'assets/panoramas/'+p.id+(!large&&innerWidth<600?'-small.webp':'-large.webp');
  function lock(){document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));}
  function stopDrift(){activity++;cancelAnimationFrame(frame);frame=0;view.dataset.drifting='false';}
  function load(p,large=false,retry=false){const url=source(p,large);if(retry)cache.delete(url);if(!cache.has(url))cache.set(url,new Promise((resolve,reject)=>{const img=new Image();img.decoding='async';img.onload=()=>img.decode().then(()=>resolve(url),reject);img.onerror=()=>reject(new Error('Image unavailable'));img.src=url;}).catch(e=>{cache.delete(url);throw e;}));return cache.get(url);}
  function status(message,retry=false){$('panorama-status').hidden=!message;$('panorama-status').querySelector('span').textContent=message;$('panorama-retry').hidden=!retry;}
  function cinemaStatus(message,retry=false){$('cinema-status').hidden=!message;$('cinema-status').querySelector('span').textContent=message;$('cinema-retry').hidden=!retry;}
  function position(){return shown?(positions.get(shown.id)??focal(shown)):50;}
  function setPosition(value){if(!shown)return;const bounded=Math.max(0,Math.min(100,value));positions.set(shown.id,bounded);images[active].style.objectPosition=bounded+'% center';}
  function overflow(){const img=images[active];return img.naturalWidth&&img.naturalHeight?Math.max(0,img.naturalWidth*(view.clientHeight/img.naturalHeight)-view.clientWidth):0;}
  function drift(p){if(visited.has(p.id))return;visited.add(p.id);if(reduced.matches||cinema.open||document.hidden||overflow()<1)return;const begin=performance.now(),start=position(),end=Math.min(100,start+6);view.dataset.drifting='true';function tick(now){const t=Math.min(1,(now-begin)/2500);setPosition(start+(end-start)*(t*t*(3-2*t)));if(t<1)frame=requestAnimationFrame(tick);else stopDrift();}frame=requestAnimationFrame(tick);}
  function metadata(p){$('view-sector').textContent=p.id;$('view-title').textContent=p.name;$('view-caption').textContent=caption(p);$('cinema-title').textContent=p.name;$('cinema-caption').textContent=caption(p);$('cinema-order').textContent='Создать сертификат ↗';$('cinema-plots').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cinemaPlot===p.id)));}
  async function renderCinema(p,retry=false){const current=++cinemaToken;if(!cinema.open)return;metadata(p);cinema.dataset.light=panel.dataset.light;cinemaStatus('Открываем «'+p.name+'»…');try{const url=await load(p,true,retry);if(current!==cinemaToken||!cinema.open)return;const next=cinemaShown?1-cinemaActive:cinemaActive,img=cinemaImages[next];img.src=url;img.alt=caption(p)+' — '+p.name;img.hidden=false;img.classList.remove('active');void img.offsetWidth;img.classList.add('active');if(next!==cinemaActive){cinemaImages[cinemaActive].classList.remove('active');cinemaImages[cinemaActive].setAttribute('aria-hidden','true');}img.removeAttribute('aria-hidden');cinemaActive=next;cinemaShown=true;cinemaStatus('');}catch{if(current!==cinemaToken||!cinema.open)return;cinemaImages.forEach(img=>img.hidden=true);cinemaShown=false;cinemaStatus('Панорама недоступна. Оформление остаётся доступным.',true);}}
  async function choose(p,retry=false){
    const current=++token;clearTimeout(timer);stopDrift();const driftActivity=activity;
    if(drawer.open)drawer.close();panel.dataset.view='loading';metadata(p);$('view-help').textContent='Открываем «'+p.name+'»…';status('Предыдущий вид остаётся на экране. Загружаем «'+p.name+'»…');
    if(cinema.open)renderCinema(p,retry);
    try{const url=await load(p,false,retry);if(current!==token)return;
      const next=1-active,img=images[next];img.src=url;img.alt=caption(p)+' — '+p.name;img.style.objectPosition=(positions.get(p.id)??focal(p))+'% center';
      img.classList.remove('active');void img.offsetWidth;img.classList.add('active');images[active].classList.remove('active');images[active].setAttribute('aria-hidden','true');img.removeAttribute('aria-hidden');active=next;shown=p;
      panel.dataset.view='panorama';status('');$('view-help').textContent='Потяните в сторону · ← →';
      timer=setTimeout(()=>{if(current===token&&activity===driftActivity)drift(p);},reduced.matches?0:450);
      if(!navigator.connection?.saveData)load(plots[(plots.indexOf(p)+1)%plots.length]).catch(()=>{});
    }catch{if(current!==token)return;panel.dataset.view='error';status('Панорама «'+p.name+'» недоступна. Показан предыдущий вид; оформление работает.',true);$('view-help').textContent='Можно повторить загрузку';}
  }
  for(const event of ['pointerdown','keydown','wheel','click'])document.addEventListener(event,stopDrift,{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopDrift();});reduced.addEventListener('change',()=>{if(reduced.matches)stopDrift();});window.addEventListener('resize',stopDrift);
  $('panorama-retry').addEventListener('click',()=>choose(getSelected(),true));
  view.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setPosition(position()+(e.key==='ArrowRight'?7:-7));}});
  view.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,position:position()};view.setPointerCapture(e.pointerId);});view.addEventListener('pointermove',e=>{if(!drag||overflow()<1)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dy)>Math.abs(dx)&&e.pointerType==='touch')return;setPosition(drag.position-dx/overflow()*100);});for(const type of ['pointerup','pointercancel','lostpointercapture'])view.addEventListener(type,()=>drag=null);
  $('plot-drawer-open').addEventListener('click',()=>{$('drawer-list').append(list);drawer.showModal();lock();$('plot-drawer-open').setAttribute('aria-expanded','true');list.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});});$('plot-drawer-close').addEventListener('click',()=>drawer.close());drawer.addEventListener('close',()=>{listHome.append(list);$('plot-drawer-open').setAttribute('aria-expanded','false');lock();$('plot-drawer-open').focus({preventScroll:true});});drawer.addEventListener('click',e=>{if(e.target===drawer){const r=drawer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right)drawer.close();}});matchMedia('(min-width:1024px)').addEventListener('change',e=>{if(e.matches&&drawer.open)drawer.close();});
  for(const p of plots){const button=document.createElement('button');button.type='button';button.dataset.cinemaPlot=p.id;button.setAttribute('aria-label',p.name+(p.id==='01'?' · VIP':''));const number=document.createElement('b');number.textContent=p.id;const title=document.createElement('span');title.textContent=p.name;button.append(number,title);button.addEventListener('click',()=>selectPlot(p.id));$('cinema-plots').append(button);}
  $('panorama-expand').addEventListener('click',()=>{stopDrift();lastOpener=document.activeElement;cinema.classList.remove('hide-interface');$('cinema-interface').setAttribute('aria-pressed','true');cinema.showModal();lock();$('cinema-close').focus();metadata(getSelected());renderCinema(getSelected());});$('cinema-close').addEventListener('click',()=>cinema.close());
  $('cinema-interface').addEventListener('click',()=>{const hidden=cinema.classList.toggle('hide-interface');$('cinema-interface').setAttribute('aria-pressed',String(!hidden));});$('cinema-retry').addEventListener('click',()=>renderCinema(getSelected(),true));cinema.addEventListener('close',()=>{cinemaToken++;lock();lastOpener?.focus({preventScroll:true});});
  images[0].removeAttribute('aria-hidden');cinemaImages[1].setAttribute('aria-hidden','true');images[0].style.objectPosition=focal(plots[0])+'% center';panel.dataset.view='panorama';metadata(plots[0]);status('');
  images[0].addEventListener('error',()=>status('Панорама временно недоступна. Попробуйте повторить загрузку.',true));
  if(images[0].complete&&!images[0].naturalWidth)status('Панорама временно недоступна. Попробуйте повторить загрузку.',true);
  if(!navigator.connection?.saveData)load(plots[1]).catch(()=>{});return {choose};
};
