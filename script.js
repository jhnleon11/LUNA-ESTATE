(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const plots = [
    {id:'01',name:'База Спокойствия',region:'Море Спокойствия · Apollo 11',area:100,price:39000,tier:'VIP',description:'Простор Моря Спокойствия и далёкий силуэт Eagle у горизонта. Личная история рядом с большой мечтой человечества.'},
    {id:'02',name:'Кратер Аристарх',region:'Aristarchus · Край кратера',area:500,price:7900,tier:'Signature',description:'Светлые террасы кратера и выразительный рельеф. Художественный вид, вдохновлённый одним из самых ярких мест Луны.'},
    {id:'03',name:'Мыс Гераклида',region:'Promontorium Heraclides · Залив Радуги',area:1000,price:12900,tier:'Sovereign',description:'Горный мыс у Залива Радуги. Тихая встреча камня и света — для тех, кто всегда смотрит дальше.'},
    {id:'04',name:'Альпийская долина',region:'Vallis Alpes · Лунные Альпы',area:100,price:2900,tier:'Essence',description:'Пространство между лунными горами. Художественная панорама по мотивам знаменитой Vallis Alpes.'},
    {id:'05',name:'Океан Бурь',region:'Oceanus Procellarum · Лавовые равнины',area:500,price:7900,tier:'Signature',description:'Тёмные лавовые равнины и каменистые горизонты. Название настоящего лунного океана — в вашей личной коллекции.'},
    {id:'06',name:'Море Ясности',region:'Mare Serenitatis · Видимая сторона Луны',area:1000,price:12900,tier:'Sovereign',description:'Свет Земли над лунным горизонтом. Художественный взгляд на видимую сторону Луны и простор Моря Ясности.'}
  ];
  const byId = id => document.getElementById(id);
  const number = value => new Intl.NumberFormat('ru-RU').format(value);
  let selected = plots[0];
  let certificatePlot = null;
  let panoramaController = null;
  let explicitSelection = false;
  let orderOpener = null;
  function selectPlot(id) {
    const plot = plots.find(p => p.id === id);
    if (!plot) return;
    selected = plot;
    document.querySelector('.estate-card').classList.toggle('is-vip',id==='01');
    byId('estate-collection-label').textContent=id==='01'?'VIP / APOLLO 11':'PRIVATE COLLECTION';
    byId('vip-note').hidden=id!=='01';
    document.querySelectorAll('[data-plot]').forEach(el => {
      const active = el.dataset.plot === id;
      el.setAttribute('aria-pressed', String(active));
      el.classList.toggle('selected', active);
    });
    byId('estate-number').textContent = `№ ${plot.id}`;
    byId('estate-name').textContent = plot.name;
    byId('estate-region').textContent = plot.region;
    byId('estate-description').textContent = plot.description;
    byId('estate-area').textContent = `${number(plot.area)} м²`;
    byId('estate-tier').textContent = plot.tier;
    byId('estate-price').textContent = `${number(plot.price)} BTC`;
    explicitSelection = true;
    document.querySelector('.cert-sample-plot').textContent = plot.name + ' · Участок № ' + plot.id;
    document.querySelector('.cert-sample-area').textContent = number(plot.area) + ' м² · ' + plot.tier + ' Collection';
    const closing = document.querySelector('.closing .button');
    closing.textContent = 'Оформить «' + plot.name + '» ↗';
    document.querySelector('.gift-copy .text-link').textContent = 'Создать сертификат — ' + plot.name + ' ↗';
    panoramaController?.choose(plot);
  }
  document.querySelectorAll('[data-plot]').forEach(el => {
    el.addEventListener('click', () => selectPlot(el.dataset.plot));
    if (el.matches('.plot')) el.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();selectPlot(el.dataset.plot);}
    });
  });
  document.querySelectorAll('.light-toggle button').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.map-panel').dataset.light = button.dataset.light;
    document.querySelectorAll('.light-toggle button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;
  const hero = document.querySelector('.hero');
  const journeyLinks = [...document.querySelectorAll('.journey-nav a')];
  const journeySections = journeyLinks.map(link => document.querySelector(link.getAttribute('href')));
  const giftScene = document.querySelector('.certificate-scene');
  const mobileJourney = document.querySelector('.mobile-journey');
  const earth = document.querySelector('.earth-depth');
  const terrainImage = document.querySelector('.terrain-night');
  let earthDistance = 0;
  let terrainPixels = null;
  let terrainSource = '';
  function calibrateEarthPath() {
    if (!terrainImage.complete || !terrainImage.naturalWidth) return;
    const style = getComputedStyle(document.documentElement);
    const imageRect = terrainImage.getBoundingClientRect();
    if (!imageRect.width || !imageRect.height) return;
    const imageX = imageRect.x + (parseFloat(style.getPropertyValue('--look-x')) || 0);
    const imageY = imageRect.y - (parseFloat(style.getPropertyValue('--terrain-travel')) || 0) + (parseFloat(style.getPropertyValue('--look-y')) || 0);
    const fallbackDistance = Math.max(0, imageY + imageRect.height * .48 - earth.offsetTop - 100 + 16);
    if (terrainSource !== terrainImage.currentSrc) {
      const canvas = document.createElement('canvas');
      canvas.width = terrainImage.naturalWidth;
      canvas.height = terrainImage.naturalHeight;
      const context = canvas.getContext('2d', {willReadFrequently:true});
      if (!context) {earthDistance = fallbackDistance;return;}
      try {
        context.drawImage(terrainImage, 0, 0);
        terrainPixels = context.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        // Browsers may disallow pixel access when index.html is opened as file://.
        terrainPixels = null;
      }
      terrainSource = terrainImage.currentSrc;
    }
    if (!terrainPixels) {earthDistance = fallbackDistance;return;}
    let horizon = 0;
    for (let sample = 0; sample <= 24; sample++) {
      const screenX = earth.offsetLeft + earth.offsetWidth * (.05 + .9 * sample / 24);
      const x = Math.max(0, Math.min(terrainPixels.width - 1, Math.round((screenX - imageX) / imageRect.width * terrainPixels.width)));
      for (let y = Math.ceil(terrainPixels.height * .33); y < terrainPixels.height; y++) {
        if (terrainPixels.data[(y * terrainPixels.width + x) * 4 + 3] >= 245) {
          horizon = Math.max(horizon, imageY + y / terrainPixels.height * imageRect.height);
          break;
        }
      }
    }
    // End just behind the local ridge, rather than racing to the screen bottom.
    earthDistance = Math.max(0, horizon - earth.offsetTop - 100 + 16);
  }
  terrainImage.addEventListener('load', () => {calibrateEarthPath();scheduleScene();});
  window.addEventListener('resize', calibrateEarthPath);
  calibrateEarthPath();
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.addEventListener('pointermove',event=>{
    if (!finePointer.matches || reducedMotion.matches) return;
    document.documentElement.style.setProperty('--look-x',`${(event.clientX/innerWidth-.5)*14}px`);
    document.documentElement.style.setProperty('--look-y',`${(event.clientY/innerHeight-.5)*8}px`);
  },{passive:true});
  document.querySelectorAll('.estate-explorer,.certificate-scene,.steps-grid article,.plot-list button').forEach(card=>{
    card.addEventListener('pointermove',event=>{
      if(!finePointer.matches || reducedMotion.matches)return;
      const rect=card.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
      card.style.setProperty('--mouse-x',`${x*100}%`);card.style.setProperty('--mouse-y',`${y*100}%`);
      if(card.matches('.certificate-scene')){card.style.setProperty('--tilt-x',`${(y-.5)*-7}deg`);card.style.setProperty('--tilt-y',`${(x-.5)*9}deg`);}
    },{passive:true});
    card.addEventListener('pointerleave',()=>{card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});
  });
  function updateScene() {
    const progress = reducedMotion.matches ? 0 : Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * .68)));
    document.documentElement.style.setProperty('--dawn', progress.toFixed(3));
    document.documentElement.style.setProperty('--parallax', `${reducedMotion.matches ? 0 : Math.min(window.scrollY * .12, 90)}px`);
    const journey = reducedMotion.matches ? 0 : Math.min(1, Math.max(0, window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
    document.documentElement.style.setProperty('--sky-travel', `${-journey*55}px`);
    const earthTravel = earthDistance * journey;
    document.documentElement.style.setProperty('--earth-travel', `${earthTravel}px`);
    document.documentElement.style.setProperty('--terrain-travel', `${-journey*100}px`);
    document.documentElement.style.setProperty('--scene-veil', (Math.min(window.scrollY / hero.offsetHeight,1)*.28).toFixed(3));
    if(reducedMotion.matches){document.documentElement.style.setProperty('--look-x','0px');document.documentElement.style.setProperty('--look-y','0px');}
    byId('light-label').textContent = progress > .5 ? 'Лунный рассвет' : 'Лунная ночь';
    const pageProgress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
    document.documentElement.style.setProperty('--journey-progress', pageProgress.toFixed(3));
    let activeStage = 0;
    journeySections.forEach((section,index) => {if(section.getBoundingClientRect().top <= innerHeight * .45) activeStage = index;});
    journeyLinks.forEach((link,index) => {if(index === activeStage) link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    mobileJourney.setAttribute('aria-valuenow', String(Math.round(pageProgress * 100)));
    mobileJourney.setAttribute('aria-valuetext', ['Горизонт','Коллекция','Сертификат'][activeStage]);
    if(giftScene.getBoundingClientRect().top < innerHeight * .85 && giftScene.getBoundingClientRect().bottom > 0) giftScene.classList.add('ceremony');
    pending = false;
  }
  function scheduleScene() {if (!pending) {pending=true;requestAnimationFrame(updateScene);}}
  window.addEventListener('scroll', scheduleScene, {passive:true});
  window.addEventListener('resize', scheduleScene);
  reducedMotion.addEventListener('change', scheduleScene);
  updateScene();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.add('visible');observer.unobserve(entry.target);}
    }), {threshold:.1});
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  const dialog = byId('estate-dialog');
  function openOrder(event) {
    orderOpener = event.currentTarget;
    certificatePlot = {...selected};
    byId('order-panorama').src = 'assets/panoramas/' + selected.id + '-small.webp';
    byId('order-panorama').alt = selected.name;
    byId('order-panorama').style.objectPosition = selected.id === '06' ? '76% center' : '50% center';
    byId('order-panorama-caption').textContent = selected.id === '01' ? 'Художественная реконструкция места высадки Apollo 11' : 'Художественная панорама';
    byId('order-summary').textContent = `${certificatePlot.name} · Участок № ${certificatePlot.id} · ${number(certificatePlot.area)} м² · ${number(certificatePlot.price)} BTC`;
    byId('order-view').hidden = false;
    byId('result-view').hidden = true;
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    document.body.classList.add('modal-open');
    dialog.showModal();
    byId('recipient').focus();
  }
  byId('choose-estate').addEventListener('click', openOrder);
  byId('cinema-order').addEventListener('click', openOrder);
  document.querySelector('.gift-copy .text-link').addEventListener('click', event => {if(explicitSelection){event.preventDefault();openOrder(event);}});
  document.querySelector('.closing .button').addEventListener('click', event => {if(explicitSelection){event.preventDefault();openOrder(event);}});
  function closeDialog(){dialog.close();}
  document.querySelector('.close-dialog').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect=dialog.getBoundingClientRect();
    if (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) closeDialog();
  });
  dialog.addEventListener('close', () => {document.body.classList.toggle('modal-open', !!document.querySelector('dialog[open]'));document.body.classList.remove('print-certificate');(orderOpener || byId('choose-estate')).focus({preventScroll:true});});
  byId('recipient').addEventListener('input', () => byId('recipient').setCustomValidity(''));
  byId('certificate-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = byId('recipient').value.trim();
    if (!name) {byId('recipient').setCustomValidity('Введите имя, а не только пробелы.');byId('recipient').reportValidity();return;}
    byId('certificate-name').textContent = name;
    byId('certificate-name').classList.toggle('long-name', name.length > 18);
    byId('certificate-plot').textContent = `${certificatePlot.name} · Участок № ${certificatePlot.id}`;
    byId('certificate-area').textContent = `${number(certificatePlot.area)} м² · ${certificatePlot.tier} Collection`;
    byId('order-view').hidden=true;
    byId('result-view').hidden=false;
    const resultCertificate = byId('certificate-output');
    resultCertificate.classList.remove('ceremony');
    requestAnimationFrame(() => requestAnimationFrame(() => resultCertificate.classList.add('ceremony')));
    dialog.setAttribute('aria-labelledby','certificate-name');
    dialog.scrollTop=0;
    byId('print-certificate').focus();
  });
  byId('edit-certificate').addEventListener('click', () => {
    byId('order-view').hidden=false;byId('result-view').hidden=true;
    dialog.setAttribute('aria-labelledby','dialog-title');byId('recipient').focus();
  });
  byId('print-certificate').addEventListener('click', () => {document.body.classList.add('print-certificate');window.print();});
  window.addEventListener('afterprint', () => document.body.classList.remove('print-certificate'));
  selectPlot(selected.id);
  if(window.LunaPanoramas) panoramaController = window.LunaPanoramas({plots, selectPlot, getSelected:()=>selected});
})();

