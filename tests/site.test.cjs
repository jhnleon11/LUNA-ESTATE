const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const url='https://jhnleon11.github.io/LUNA-ESTATE/';

test('Published metadata consistently describes the educational site',()=>{
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
  assert.ok(html.includes(`property="og:url" content="${url}"`));
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.ok(data['@graph'].every(item=>item.url===url));
  assert.ok(!JSON.stringify(data).includes('"Offer"'));
  assert.ok(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').includes(`<loc>${url}</loc>`));
});

test('Every static local reference and each of the six panorama sets exists',()=>{
  for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    const resource=match[1];
    if(/^(?:https?:|data:)/.test(resource))continue;
    assert.ok(fs.existsSync(path.join(root,resource)),resource);
  }
  for(let i=1;i<=6;i++)for(const size of ['large','small','thumb']){
    assert.ok(fs.existsSync(path.join(root,'assets','panoramas',`${String(i).padStart(2,'0')}-${size}.webp`)));
  }
});

function designHarness(href,saved,blocked=false,historyBlocked=false){
  const events={},buttons=['gold','orbit','moonlight'].map(design=>({dataset:{designChoice:design},pressed:null,events:{},setAttribute(_,value){this.pressed=value;},addEventListener(name,handler){this.events[name]=handler;}}));
  const document={documentElement:{dataset:{}},querySelectorAll:selector=>selector==='[data-design-choice]'?buttons:[],getElementById:()=>({textContent:''}),querySelector:()=>({content:''}),addEventListener:(name,handler)=>events[name]=handler};
  const location={href};
  const entries=[{url:href,state:null}];let entry=0;
  const history={
    get state(){return entries[entry].state;},
    replaceState(state,_,url){if(historyBlocked)throw Error('History denied');entries[entry]={url:String(url),state};location.href=String(url);},
    pushState(state,_,url){if(historyBlocked)throw Error('History denied');entries.splice(entry+1);entries.push({url:String(url),state});entry++;location.href=String(url);},
    back(){if(entry>0){entry--;location.href=entries[entry].url;events.popstate({state:entries[entry].state});}},
    forward(){if(entry<entries.length-1){entry++;location.href=entries[entry].url;events.popstate({state:entries[entry].state});}}
  };
  const localStorage={getItem(){if(blocked)throw Error('Denied');return saved;},setItem(){if(blocked)throw Error('Denied');}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'designs.js'),'utf8'),{document,location,history,localStorage,URL,window:{addEventListener:(name,handler)=>events[name]=handler}});
  events.DOMContentLoaded();
  return {document,buttons,events,location,history};
}

test('Design links override storage; a blocked store still permits switching and history',()=>{
  const state=designHarness(url+'?design=orbit#collection','moonlight',true);
  assert.equal(state.document.documentElement.dataset.design,'orbit');
  state.buttons[2].events.click();
  assert.equal(state.document.documentElement.dataset.design,'moonlight');
  assert.equal(new URL(state.location.href).hash,'#collection');
  assert.equal(new URL(state.location.href).searchParams.get('design'),'moonlight');
  state.location.href=url+'?design=gold#gift';state.events.popstate();
  assert.equal(state.document.documentElement.dataset.design,'gold');
  assert.deepEqual(state.buttons.map(button=>button.pressed),['true','false','false']);
});

test('An invalid design parameter cannot activate an arbitrary appearance',()=>{
  const state=designHarness(url+'?design=unknown','unknown');
  assert.equal(state.document.documentElement.dataset.design,'gold');
});

test('Back restores a saved design on the original parameterless URL',()=>{
  const state=designHarness(url+'?campaign=homework#collection','moonlight');
  assert.equal(state.document.documentElement.dataset.design,'moonlight');
  state.buttons[1].events.click();
  assert.equal(new URL(state.location.href).searchParams.get('campaign'),'homework');
  state.history.back();
  assert.equal(state.location.href,url+'?campaign=homework#collection');
  assert.equal(state.document.documentElement.dataset.design,'moonlight');
  state.history.forward();
  assert.equal(state.document.documentElement.dataset.design,'orbit');
  assert.deepEqual(state.buttons.map(button=>button.pressed),['false','true','false']);
});

test('A blocked store does not prevent restoring an explicit URL through history',()=>{
  const state=designHarness(url+'?design=moonlight#gift',null,true);
  state.buttons[0].events.click();state.buttons[1].events.click();
  state.history.back();assert.equal(state.document.documentElement.dataset.design,'gold');
  state.history.back();assert.equal(state.document.documentElement.dataset.design,'moonlight');
  assert.equal(new URL(state.location.href).hash,'#gift');
});

test('Appearance switching remains usable when the preview denies history writes',()=>{
  const state=designHarness(url,'gold',true,true);
  state.buttons[2].events.click();
  assert.equal(state.document.documentElement.dataset.design,'moonlight');
  assert.equal(state.buttons[2].pressed,'true');
  assert.equal(state.location.href,url);
});
