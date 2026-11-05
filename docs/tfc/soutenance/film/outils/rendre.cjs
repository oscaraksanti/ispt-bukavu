// node rendre.cjs <debut_s> <fin_s> [fps] — écrit ~/film/images/f00000.jpg …
const { chromium } = require(process.env.HOME + '/tools/node_modules/playwright-core');
const fs=require('fs'); const R='/sessions/intelligent-gallant-feynman/mnt/Projet-TFC-ISPT/docs/tfc';
const [d,f]=[+process.argv[2],+process.argv[3]]; const FPS=+(process.argv[4]||30);
const OUT=process.env.HOME+'/film/images/'; fs.mkdirSync(OUT,{recursive:true});
(async()=>{
  const b=await chromium.launch({ executablePath: process.env.HOME + '/tools/chrome-linux/headless_shell', args:['--no-sandbox','--allow-file-access-from-files','--font-render-hinting=none'], env:{...process.env, LD_LIBRARY_PATH: process.env.HOME + '/tools/libs/usr/lib/aarch64-linux-gnu'} });
  const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  for (const n of ['film.html','film.js']) fs.copyFileSync(R+'/soutenance/film/'+n, process.env.HOME+'/film/'+n);
  await p.goto('file://'+process.env.HOME+'/film/film.html?captures=captures&blason=file://'+R+'/ressources/blason.png');
  await p.evaluate(()=>window.pret);
  const t0=Date.now(); let n=0;
  for(let i=Math.round(d*FPS); i<Math.round(f*FPS); i++){
    const fic=OUT+'f'+String(i).padStart(5,'0')+'.jpg';
    if(process.env.REPRENDRE && fs.existsSync(fic)) continue;
    await p.evaluate(t=>render(t), i/FPS);
    await p.screenshot({path:fic,type:'jpeg',quality:93});
    n++;
  }
  console.log(n,'images en',((Date.now()-t0)/1000).toFixed(1),'s');
  await b.close();
})();
