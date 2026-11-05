const { chromium } = require(process.env.HOME + '/tools/node_modules/playwright-core');
const B='http://localhost:3000';
exports.B=B;
exports.lancer=()=>chromium.launch({ executablePath: process.env.HOME + '/tools/chrome-linux/headless_shell', args:['--no-sandbox','--font-render-hinting=none'], env:{...process.env, LD_LIBRARY_PATH: process.env.HOME + '/tools/libs/usr/lib/aarch64-linux-gnu'} });
exports.session=async(b,id,opts={})=>{
  const ctx=await b.newContext({viewport:opts.vp||{width:1920,height:1080},deviceScaleFactor:opts.dsf||2,reducedMotion:'reduce',serviceWorkers:'block',isMobile:!!opts.mobile,hasTouch:!!opts.mobile,extraHTTPHeaders:{'x-forwarded-for':'10.40.'+Math.floor(Math.random()*200)+'.'+Math.floor(Math.random()*200)}});
  const p=await ctx.newPage();
  if(id){ await p.goto(B+'/connexion',{waitUntil:'networkidle'}); await p.fill('#email',id); await p.fill('#motDePasse','Demo-ISPT-2026'); await p.click('button[type=submit]'); await p.waitForURL(u=>!u.pathname.startsWith('/connexion'),{timeout:25000}); await p.waitForLoadState('networkidle'); }
  return {ctx,p};
};
