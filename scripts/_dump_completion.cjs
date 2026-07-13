// Calcule pour CHAQUE compte non-admin un score de complétion + actions restantes.
// Sortie: campagne madaspot/completion_targets.json
const fs = require('fs');
let url = (fs.readFileSync('.env','utf8').match(/DATABASE_URL\s*=\s*"?([^"\n\r]+)"?/)||[])[1].replace(/[?&]sslmode=[^&]*/,'');
const { Client } = require('pg');
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
const OUT = 'C:/Users/ISIM NICE/Desktop/campagne madaspot/completion_targets.json';
const parseImg = r => { if(!r) return []; try{const j=JSON.parse(r);return Array.isArray(j)?j:[]}catch{return []} };

(async()=>{
  await c.connect();
  const users = (await c.query(`SELECT id,email,"firstName","lastName","userType",role FROM "User" WHERE email IS NOT NULL AND (role <> 'ADMIN' OR role IS NULL)`)).rows;
  const ests = (await c.query(`SELECT id,name,type,city,slug,"coverImage",images,gallery,description,phone,email,whatsapp,"claimedByUserId","createdByUserId" FROM "Establishment"`)).rows;
  const byOwner = {};
  for(const e of ests){ for(const k of [e.claimedByUserId,e.createdByUserId]){ if(k){(byOwner[k]=byOwner[k]||[]).push(e);} } }

  const hasPhotos = e => !!e.coverImage || parseImg(e.images).length>0 || parseImg(e.gallery).length>0;
  const hasDesc   = e => e.description && e.description.trim().length>=30;
  const hasContact= e => !!(e.phone || e.email || e.whatsapp);

  // score d'une fiche (sur 4 critères fiche)
  function fscore(e){ return [true, hasPhotos(e), hasDesc(e), hasContact(e)].filter(Boolean).length; }

  const out = [];
  for(const u of users){
    const owned = byOwner[u.id] || [];
    let steps; // {key,label,done,link}
    let best = null;
    if(owned.length){
      // choisit la fiche la plus complète comme "fiche principale"
      best = owned.slice().sort((a,b)=> fscore(b)-fscore(a))[0];
    }
    const DASH = 'https://madaspot.com/dashboard/etablissement';
    const L = { general: DASH+'?tab=general', photos: DASH+'?tab=photos', contact: DASH+'?tab=contact' };
    if(!best){
      steps = [
        {key:'compte', label:'Compte créé', done:true},
        {key:'fiche',  label:'Publier votre fiche établissement', done:false, link:L.general},
        {key:'photos', label:'Ajouter vos photos', done:false, link:L.photos},
        {key:'desc',   label:'Rédiger votre description', done:false, link:L.general},
        {key:'contact',label:'Renseigner vos coordonnées', done:false, link:L.contact},
      ];
    } else {
      steps = [
        {key:'compte', label:'Compte créé', done:true},
        {key:'fiche',  label:'Fiche établissement publiée', done:true},
        {key:'photos', label:'Ajouter vos photos', done:hasPhotos(best), link:L.photos},
        {key:'desc',   label:'Rédiger votre description', done:hasDesc(best), link:L.general},
        {key:'contact',label:'Renseigner vos coordonnées', done:hasContact(best), link:L.contact},
      ];
    }
    const doneCount = steps.filter(s=>s.done).length;
    const pct = Math.round(doneCount/steps.length*100);
    if(pct >= 100) continue; // rien à faire -> on n'envoie pas
    const firstTodo = steps.find(s=>!s.done && s.link);
    const ctaLink = firstTodo ? firstTodo.link : (DASH+'?tab=general');
    out.push({
      email:u.email, firstName:u.firstName||'', lastName:u.lastName||'',
      establishmentName: best ? best.name : '',
      city: best ? best.city : '',
      pct, doneCount, totalSteps: steps.length,
      steps: steps.map(s=>({label:s.label,done:s.done,link:s.link||null})),
      ctaLink,
      situation: best ? 'incomplete' : 'no_fiche',
    });
  }
  // tri: les plus proches de finir d'abord (plus persuasif), puis sans fiche
  out.sort((a,b)=> b.pct - a.pct);
  fs.writeFileSync(OUT, JSON.stringify(out,null,2),'utf-8');
  const dist = {};
  out.forEach(o=>{dist[o.pct]=(dist[o.pct]||0)+1;});
  console.log('Cibles (compte < 100%):', out.length);
  console.log('Répartition par score:', JSON.stringify(dist));
  console.log('Exporté ->', OUT);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
