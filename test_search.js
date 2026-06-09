import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const q = '%145%';
  const { data, error } = await supabase
    .from('delivery_clients')
    .select('*')
    .or(`name.ilike.${q},order_number.ilike.${q}`);
    
  console.log('ERROR:', error);
  console.log('DATA LEN:', data?.length);
}
run();
