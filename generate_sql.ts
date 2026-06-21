import * as fs from 'fs';

const data = fs.readFileSync('update_customers_data.txt', 'utf8');
const lines = data.split('\n').filter(l => l.trim() !== '');

// Skip header
lines.shift();

let sql = `-- Atualização de clientes - Empresa Delicius
-- Para executar no painel SQL do Supabase

DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Encontra a empresa Delicius
  SELECT id INTO v_company_id FROM public.companies WHERE name ILIKE '%Delicius%' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa Delicius não encontrada';
  END IF;

`;

for (const line of lines) {
  const parts = line.split('\t');
  if (parts.length >= 1) {
    const document = parts[0].trim();
    const region = parts.length > 1 ? parts[1].trim() : '';
    const rep = parts.length > 2 ? parts[2].trim() : '';
    
    if (!document) continue;

    let updates = [];
    if (region) {
      updates.push(`region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%${region.replace(/'/g, "''")}%' LIMIT 1)`);
    }
    if (rep) {
      updates.push(`sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%${rep.replace(/'/g, "''")}%' OR legal_name ILIKE '%${rep.replace(/'/g, "''")}%') LIMIT 1)`);
    }

    if (updates.length > 0) {
      sql += `  UPDATE public.customers 
  SET 
    ${updates.join(',\n    ')}
  WHERE company_id = v_company_id AND document = '${document.replace(/'/g, "''")}';\n\n`;
    }
  }
}

sql += `END $$;\n`;

fs.writeFileSync('update_customers.sql', sql);
console.log('Arquivo update_customers.sql gerado com sucesso.');
