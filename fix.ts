import { supabase } from './src/lib/supabase.ts';

async function fix() {
  // First find the product
  const { data: prods } = await supabase.from('products').select('*').eq('code', '00174');
  if (!prods || prods.length === 0) {
    console.log("Product not found");
    return;
  }
  const p = prods[0];
  console.log("Found product:", p.description, p.external_code);
  
  if (p.external_code === '2255') {
    // Restore
    const { error: err1 } = await supabase.from('products').update({ external_code: '0106028838583506' }).eq('id', p.id);
    if (err1) console.error("Error updating external_code:", err1);
    else console.log("Restored external_code");
    
    // Add to related_codes
    const { error: err2 } = await supabase.from('related_codes').insert({
      product_id: p.id,
      code: '2255',
      company_id: p.company_id
    });
    if (err2) console.error("Error inserting related code:", err2);
    else console.log("Added 2255 to related_codes");
  } else {
    console.log("external_code is already", p.external_code);
  }
}

fix();
