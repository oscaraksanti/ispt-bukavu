const {B,lancer,session}=require('./commun.cjs'); const fs=require('fs');
(async()=>{
  const b=await lancer(); const etat={};
  // 1. publier les évaluations transmises
  let {ctx,p}=await session(b,'demo.academique@example.org',{dsf:1});
  for(let k=0;k<3;k++){
    await p.goto(B+'/admin/notes?vue=SOUMISE',{waitUntil:'networkidle'});
    const l=p.locator('main a[href^="/admin/notes/c"]'); if(!(await l.count())) break;
    await l.first().click(); await p.waitForLoadState('networkidle');
    const v=p.getByRole('button',{name:'Valider'}); if(await v.count()){await v.click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);}
    const pub=p.getByRole('button',{name:/Publier/}); if(await pub.count()){await pub.first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);}
    console.log('publiée', p.url());
  }
  await p.goto(B+'/admin/deliberations',{waitUntil:'networkidle'});
  console.log(JSON.stringify(await p.evaluate(()=>({a:[...document.querySelectorAll('main a')].map(e=>e.textContent.trim().slice(0,40)+'→'+e.getAttribute('href')).slice(0,20),btn:[...document.querySelectorAll('main button')].map(e=>e.textContent.trim().slice(0,40)).slice(0,20)}))));
  await ctx.close();
  // 2. demande d'attestation
  ({ctx,p}=await session(b,'DEMO0001',{dsf:1}));
  await p.goto(B+'/etudiant/documents',{waitUntil:'networkidle'});
  await p.locator('[name="motif"]').first().fill('Dossier de bourse');
  await p.getByRole('button',{name:'Envoyer la demande'}).click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
  await ctx.close();
  ({ctx,p}=await session(b,'demo.academique@example.org',{dsf:1}));
  await p.goto(B+'/admin/documents',{waitUntil:'networkidle'});
  await p.getByRole('button',{name:/^Émettre$/}).first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
  etat.document=await p.locator('main a[href^="/documents/"]').first().getAttribute('href');
  await p.goto(B+etat.document,{waitUntil:'networkidle'});
  etat.verifier=await p.evaluate(()=>{const m=document.body.innerText.match(/\/verifier\/([A-Za-z0-9-]+)/);return m?'/verifier/'+m[1]:null});
  await ctx.close();
  fs.writeFileSync(process.env.HOME+'/film/etat.json',JSON.stringify(etat)); console.log(etat);
  await b.close();
})();
