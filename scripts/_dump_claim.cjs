const fs=require('fs');
let url=(fs.readFileSync('.env','utf8').match(/DATABASE_URL\s*=\s*"?([^"\n\r]+)"?/)||[])[1].replace(/[?&]sslmode=[^&]*/,'');
const { Client } = require('pg');
const c=new Client({connectionString:url,ssl:{rejectUnauthorized:false}});
const OUT='C:/Users/ISIM NICE/Desktop/campagne madaspot/claim_targets.json';
const path={HOTEL:'hotels',RESTAURANT:'restaurants',ATTRACTION:'attractions',PROVIDER:'prestataires'};
(async()=>{
  await c.connect();
  const ests=(await c.query(`SELECT name,type,city,slug,email,"isActive","archivedAt","moderationStatus","claimedByUserId","createdByUserId","isClaimed" FROM "Establishment"`)).rows;
  const isLive=e=>e.isActive===true&&!e.archivedAt&&(e.moderationStatus==='approved'||e.moderationStatus==null);
  const orphan=ests.filter(e=>!e.claimedByUserId&&!e.createdByUserId&&isLive(e));
  const withEmail=orphan.filter(e=>e.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email.trim()));
  // dédoublonne par email (1 mail par destinataire, on garde la 1ère fiche)
  const seen=new Set(); const out=[];
  for(const e of withEmail){
    const em=e.email.trim().toLowerCase();
    if(seen.has(em)) continue; seen.add(em);
    out.push({ email:e.email.trim(), name:e.name, type:e.type, city:e.city||'',
      slug:e.slug, claimUrl:`https://madaspot.com/${path[e.type]||'prestataires'}/${e.slug}` });
  }
  fs.writeFileSync(OUT,JSON.stringify(out,null,2),'utf-8');
  console.log('Orphelines visibles:',orphan.length,'| avec email valide:',withEmail.length,'| destinataires uniques:',out.length);
  const byType={}; orphan.forEach(e=>byType[e.type]=(byType[e.type]||0)+1);
  console.log('Orphelines par type:',JSON.stringify(byType));
  console.log('Exemple:',JSON.stringify(out[0]));
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
