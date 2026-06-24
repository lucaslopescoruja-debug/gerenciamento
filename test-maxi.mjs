import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.vercel.local', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'))
  .map(line => {
    const i = line.indexOf('=');
    return [line.slice(0, i), line.slice(i + 1).replace(/^"|"$/g, '')];
  })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

(async () => {
  const { data } = await supabase.from('companies').select('maxiprod_api_token').limit(1).single();
  const token = data.maxiprod_api_token;
  console.log('Token len:', token.length);
  
  // Try /itens
  console.log('Fetching /api/v3/itens...');
  const res1 = await fetch('https://api.maxiprod.com.br/api/v3/itens?limit=1', { headers: { 'Authorization': 'Bearer ' + token } });
  console.log('HTTP Status:', res1.status, res1.statusText);
  console.log('Body:', await res1.text());

  // Try /api/itens
  console.log('Fetching /api/itens...');
  const res2 = await fetch('https://api.maxiprod.com.br/api/itens?limit=1', { headers: { 'Authorization': 'Bearer ' + token } });
  console.log('HTTP Status:', res2.status, res2.statusText);
  console.log('Body:', await res2.text());
})();
