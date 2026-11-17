import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const catalog=fs.readFileSync(path.join(root,'data','workout-templates.json'),'utf8').trim();
const schema=fs.readFileSync(path.join(root,'supabase','app-data.schema.sql'),'utf8').trim();
const seed=fs.readFileSync(path.join(root,'supabase','app-data.seed.sql'),'utf8').replaceAll('__WORKOUT_CATALOG_JSON__',catalog);
fs.writeFileSync(path.join(root,'supabase','app-data.sql'),`${schema}\n\n${seed.trim()}\n`,'utf8');
console.log('supabase/app-data.sql 생성 완료');
