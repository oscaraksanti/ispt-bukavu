const {B,lancer,session}=require('./commun.cjs'); const fs=require('fs');
(async()=>{
  const b=await lancer(); const etat=JSON.parse(fs.readFileSync(process.env.HOME+'/film/etat.json'));
  let {ctx,p}=await session(b,'demo.academique@example.org',{dsf:1});
  await p.goto(B+etat.deliberation,{waitUntil:'networkidle'});
  const champs=await p.evaluate(()=>[...document.querySelectorAll('main input,main select')].map(e=>e.name+':'+e.type).slice(0,15)); console.log(champs);
  const d=p.locator('input[type=date]').first(); if(await d.count()) await d.fill('2026-11-04');
  const inputs=p.locator('main input[type=text], main input:not([type])');
  const sec=p.getByLabel(/Secrétaire du jury/); const pre=p.getByLabel(/Président du jury/);
  await sec.fill('Secrétaire du jury (démonstration)'); await pre.fill('Président du jury (démonstration)');
  await p.getByRole('button',{name:'Enregistrer'}).first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1200);
  await p.getByRole('button',{name:'Clôturer le jury'}).click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500);
  console.log((await p.locator('main').innerText()).slice(0,500));
  const pr=p.getByRole('button',{name:/Proclamer/}); console.log('proclamer',await pr.count());
  if(await pr.count()){ p.on('dialog',d=>d.accept()); await pr.first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(2000); console.log((await p.locator('main').innerText()).slice(0,400)); }
  await b.close();
})();
