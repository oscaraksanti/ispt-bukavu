const {B,lancer,session}=require('./commun.cjs'); const fs=require('fs');
(async()=>{
  const b=await lancer(); const etat=JSON.parse(fs.readFileSync(process.env.HOME+'/film/etat.json'));
  let {ctx,p}=await session(b,'demo.academique@example.org',{dsf:1});
  await p.goto(B+'/admin/notes',{waitUntil:'networkidle'});
  console.log(await p.locator('main').innerText().then(t=>t.slice(0,300)));
  await p.goto(B+'/admin/deliberations',{waitUntil:'networkidle'});
  await p.getByRole('button',{name:'Préparer : semestre 1'}).first().click();
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500);
  console.log('URL',p.url()); console.log((await p.locator('main').innerText()).slice(0,1200));
  if(p.url().includes('/admin/deliberations/c')) etat.deliberation=new URL(p.url()).pathname;
  fs.writeFileSync(process.env.HOME+'/film/etat.json',JSON.stringify(etat));
  await b.close();
})();
