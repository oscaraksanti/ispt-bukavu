const {B,lancer,session}=require('./commun.cjs'); const fs=require('fs');
(async()=>{
  const b=await lancer(); const etat=JSON.parse(fs.readFileSync(process.env.HOME+'/film/etat.json'));
  let {ctx,p}=await session(b,'demo.academique@example.org',{dsf:1});
  await p.goto(B+etat.deliberation,{waitUntil:'networkidle'});
  const clic=async(n)=>{const x=p.getByRole('button',{name:n}); if(await x.count()){await x.first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500); return true} return false};
  await clic('Clôturer le jury'); await clic('Confirmer');
  console.log('après clôture', (await p.locator('main').innerText()).slice(300,700));
  await clic(/^Proclamer/); await clic('Confirmer');
  console.log('après proclamation', (await p.locator('main').innerText()).slice(300,800));
  await b.close();
})();
