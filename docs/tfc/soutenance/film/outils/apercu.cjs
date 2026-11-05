const { chromium } = require(process.env.HOME + '/tools/node_modules/playwright-core');
const fs=require('fs'); const R='/sessions/intelligent-gallant-feynman/mnt/Projet-TFC-ISPT/docs/tfc';
const T=process.argv.slice(2).map(Number); fs.mkdirSync(process.env.HOME+'/film/apercu',{recursive:true});
(async()=>{
  const b=await chromium.launch({ executablePath: process.env.HOME + '/tools/chrome-linux/headless_shell', args:['--no-sandbox','--allow-file-access-from-files'], env:{...process.env, LD_LIBRARY_PATH: process.env.HOME + '/tools/libs/usr/lib/aarch64-linux-gnu'} });
  const p=await b.newPage({viewport:{width:1920,height:1080}});
  for (const n of ['film.html','film.js']) fs.copyFileSync(R+'/soutenance/film/'+n, process.env.HOME+'/film/'+n);
  p.on('console',m=>console.log('console',m.text())); p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+process.env.HOME+'/film/film.html?captures=captures&blason=file://'+R+'/ressources/blason.png');
  await p.evaluate(()=>window.pret);
  for(const t of T){ await p.evaluate(t=>render(t),t); await p.screenshot({path:process.env.HOME+'/film/apercu/t'+String(t).padStart(5,'0')+'.jpg',type:'jpeg',quality:80}); }
  await b.close();
})();
