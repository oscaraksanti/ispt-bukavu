// Captures Full HD pour le film. LOT=public|candidat|... (une session par lot)
const {B,lancer,session}=require('./commun.cjs'); const fs=require('fs');
const S=process.env.HOME+'/film/captures/'; fs.mkdirSync(S,{recursive:true});
const etat=JSON.parse(fs.readFileSync(process.env.HOME+'/film/etat.json'));
const BUREAU={vp:{width:1920,height:1080},dsf:1.5}, MOBILE={vp:{width:390,height:844},dsf:3,mobile:true};
const lots={
  public:[[null,BUREAU,[['/','accueil',1],['/formations/genie-informatique','filiere',1],['/admissions','admissions',1],['/galerie','galerie'],[etat.verifier,'verifier']]],
          [null,MOBILE,[['/','accueil-mobile']]]],
  candidat:[['demo.candidat@example.org',BUREAU,[['/candidat','candidat',1]]],
            ['demo.appariteur@example.org',BUREAU,[['/admin/admissions','admin-admissions'],['/admin/valve','admin-valve'],['@dossier','admin-dossier',1]]]],
  reprise:[['demo.appariteur@example.org',BUREAU,[['@dossier','admin-dossier',1]]],['DEMO0001',BUREAU,[['@bulletin','bulletin',1]]]],
  etudiant:[['DEMO0001',MOBILE,[['/etudiant','etu-accueil'],['/etudiant/notes','etu-notes'],['/etudiant/horaire','etu-horaire'],['/etudiant/frais','etu-frais'],['/etudiant/valve','etu-valve'],['/etudiant/resultats','etu-resultats']]],
            ['DEMO0001',BUREAU,[['/etudiant/horaire','etu-horaire-bureau'],['/etudiant/resultats','etu-resultats-bureau'],['@bulletin','bulletin']]]],
  enseignant:[['demo.enseignant@example.org',BUREAU,[['/enseignant','ens-accueil'],['@cours','ens-cours'],['@evaluation','ens-evaluation',1],['@presences','ens-presences']]]],
  academique:[['demo.academique@example.org',BUREAU,[['/admin/notes?vue=PUBLIEE','adm-notes'],[etat.deliberation,'adm-deliberation',1],[etat.deliberation.replace('/admin','')+'/pv','adm-pv'],['/admin/examens','adm-examens'],['/admin/documents','adm-documents'],[etat.document,'attestation']]]],
  direction:[['demo.direction@example.org',BUREAU,[['/admin','dir-tdb'],['/admin/pilotage','dir-pilotage',1],['/admin/journal','dir-journal'],['/admin/demarrage','dir-demarrage']]],
             ['demo.caisse@example.org',BUREAU,[['/admin/finances','caisse-finances']]]],
};
(async()=>{
  const b=await lancer();
  for(const [id,o,pages] of lots[process.env.LOT]){
    const {ctx,p}=await session(b,id,o);
    for(let [u,nom,plein] of pages){
      if(u==='@dossier'){ await p.goto(B+'/admin/admissions',{waitUntil:'networkidle'}); const hs=await p.evaluate(()=>[...document.querySelectorAll('main a')].map(a=>a.getAttribute('href'))); console.log(hs.join(' ')); u=hs.find(h=>/\/admin\/admissions\/(?!campagnes)[a-z0-9]{20,}/.test(h||'')); if(!u){console.log('pas de dossier');continue;} }
      if(u==='@bulletin'){ await p.goto(B+'/etudiant/documents',{waitUntil:'networkidle'}); const hs=await p.evaluate(()=>[...document.querySelectorAll('a')].map(a=>a.getAttribute('href')).filter(h=>h&&h.startsWith('/documents/'))); console.log(hs); u=hs[0]; if(!u){console.log('pas de bulletin');continue;} }
      if(u==='@cours'){ await p.goto(B+'/enseignant',{waitUntil:'networkidle'}); u=await p.getByRole('link',{name:/Algorithmique/}).first().getAttribute('href'); etat.cours=u; }
      if(u==='@evaluation'){ await p.goto(B+etat.cours,{waitUntil:'networkidle'}); u=await p.getByRole('link',{name:/Interrogation 1/}).first().getAttribute('href'); }
      if(u==='@presences'){ u=etat.cours+'/presences'; }
      const r=await p.goto(B+u,{waitUntil:'networkidle'}); await p.waitForTimeout(700);
      await p.evaluate(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode;if(n.nodeValue.includes('localhost:3000'))n.nodeValue=n.nodeValue.replace('localhost:3000','www.isptbukavu.org');}});
      await p.evaluate(()=>{const s=document.createElement('style'); s.textContent='*{caret-color:transparent!important} ::-webkit-scrollbar{display:none}'; document.head.appendChild(s);});
      await p.screenshot({path:S+nom+'.jpg',type:'jpeg',quality:92,fullPage:!!plein});
      console.log(nom,r.status(),new URL(p.url()).pathname);
    }
    await ctx.close();
  }
  await b.close();
})();
