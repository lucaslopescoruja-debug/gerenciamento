import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key) acc[key.trim()] = value.join('=').trim().replace(/"/g, '');
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: companies, error: errC } = await supabase.from('companies').select('id, name, active');
  console.log("Companies:", companies);

  const { data: payments, error: errP } = await supabase.from('company_payments').select('*');
  console.log("All Payments:", payments);
  
  if (errP) {
      console.log("Error payments:", errP);
  }
}

main();
