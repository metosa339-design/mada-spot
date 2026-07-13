// Génère la liste des comptes "non conformes" pour relance Gmail.
// Groupe A : compte pro sans aucune fiche.  Groupe B : fiche incomplète.
const fs = require('fs');
let url = (fs.readFileSync('.env','utf8').match(/DATABASE_URL\s*=\s*"?([^"\n\r]+)"?/)||[])[1].replace(/[?&]sslmode=[^&]*/,'');
const { Client } = require('pg');
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
const OUT = 'C:/Users/ISIM NICE/Desktop/campagne madaspot/non_conforme_owners.json';
const parseImg = r => { if(!r) return []; try{const j=JSON.parse(r);return Array.isArray(j)?j:[]}catch{return []} };

(async()=>{
  await c.connect();
  const users = (await c.query(`SELECT id,email,"firstName","lastName",role,"userType" FROM "User" WHERE email IS NOT NULL`)).rows;
  const ests = (await c.query(`SELECT id,name,type,city,slug,"coverImage",images,gallery,description,phone,email,"claimedByUserId","createdByUserId" FROM "Establishment"`)).rows;
  const byOwner = {};
  for(const e of ests){ for(const k of [e.claimedByUserId,e.createdByUserId]){ if(k){(byOwner[k]=byOwner[k]||[]).push(e);} } }
  const missing = e => {
    const m=[];
    if(!e.coverImage && parseImg(e.images).length===0 && parseImg(e.gallery).length===0) m.push('photos');
    if(!e.description || e.description.trim().length<30) m.push('description');
    if(!e.phone && !e.email) m.push('contact');
    return m;
  };
  const out = [];
  const seen = new Set();
  for(const u of users){
    if(u.role==='ADMIN') continue;
    const email = u.email.toLowerCase();
    if(seen.has(email)) continue;
    const owned = byOwner[u.id] || [];
    if(owned.length===0){
      if(!u.userType) continue; // pas un compte pro -> simple voyageur, on ignore
      seen.add(email);
      out.push({ email:u.email, firstName:u.firstName||'', lastName:u.lastName||'',
        situation:'no_fiche', userType:u.userType, establishmentName:'', missing:['fiche'] });
    } else {
      // prend la fiche la plus incomplète
      let worst=null, worstM=[];
      for(const e of owned){ const m=missing(e); if(m.length>worstM.length){worst=e;worstM=m;} }
      if(worstM.length===0) continue; // tout est conforme
      seen.add(email);
      out.push({ email:u.email, firstName:u.firstName||'', lastName:u.lastName||'',
        situation:'incomplete', establishmentName:worst.name, establishmentType:worst.type,
        city:worst.city, slug:worst.slug, missing:worstM });
    }
  }
  fs.writeFileSync(OUT, JSON.stringify(out,null,2),'utf-8');
  const a = out.filter(o=>o.situation==='no_fiche').length;
  const b = out.filter(o=>o.situation==='incomplete').length;
  console.log(`Total cibles: ${out.length}  (sans fiche: ${a}, fiche incomplete: ${b})`);
  console.log(`Exporté -> ${OUT}`);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
