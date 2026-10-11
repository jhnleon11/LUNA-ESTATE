// Copies a ready-to-publish static site. No visitor build or server is needed.
const fs=require('node:fs'),path=require('node:path');
const root=__dirname,out=path.resolve(root,'dist');
if(out!==path.join(root,'dist'))throw new Error('Unexpected output directory');
fs.mkdirSync(out,{recursive:true});
const files=['index.html','styles.css','journey.css','refinements.css','gold.css','designs.css','script.js','panoramas.js','designs.js','sitemap.xml','README.md','.nojekyll'];
for(const name of files)fs.copyFileSync(path.join(root,name),path.join(out,name));
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
const oldEffects=path.join(out,'effects.css');if(fs.existsSync(oldEffects))fs.unlinkSync(oldEffects);
const oldAtlas=path.join(out,'assets','moon-atlas.webp');if(fs.existsSync(oldAtlas))fs.unlinkSync(oldAtlas);
console.log('Ready: '+out);
