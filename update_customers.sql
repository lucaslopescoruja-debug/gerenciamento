-- Atualização de clientes - Empresa Delicius
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

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '13.518.904/0001-55';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '18.573.338/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '20.046.310/0001-54';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.948.562/0001-80';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '22.875.292/0001-49';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '30.721.946/0001-08';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.710.041/0001-68';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '36.411.731/0001-77';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.768.332/0001-20';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '43.496.038/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '45.106.775/0001-84';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '45.843.809/0001-13';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '49.741.744/0001-56';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '50.554.811/0001-02';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.092.395/0001-01';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.214.438/0001-76';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.515.844/0001-79';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.926.983/0001-95';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '53.995.373/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '54.265.496/0001-54';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '55.002.135/0001-88';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '57.887.152/0001-75';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '59.077.308/0001-88';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '61.614.562/0001-10';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '61.650.238/0001-57';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '61.823.851/0001-29';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '62.237.473/0001-64';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '62.238.913/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '64.485.975/0001-30';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '65.266.120/0001-80';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '65.683.741/0001-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.967.089/0001-89';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '00.967.735/0001-99';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '10.670.138/0001-51';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '625.030.655-20';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '22.683.079/0001-35';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '29.243.815/0001-83';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '23.665.337/0001-13';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '62.717.547/0001-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '781.332.033-68';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '02.907.051/0001-27';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '15.493.443/0001-39';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '20.590.235/0001-98';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '18.540.891/0001-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '994.417.215-49';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '14.051.257/0001-87';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.265.419/0001-50';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '855.739.226-53';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.301.681/0001-47';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '46.665.405/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.409.672/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.255.583/0001-01';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '09.314.668/0001-88';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.394.581/0001-05';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '443.593.065-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '49.456.442/0001-36';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '106.923.368-42';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '861.347.795-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.487.741/0001-01';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '27.420.352/0001-52';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '18.639.140/0001-70';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.719.986/0001-39';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '02.283.977/0001-99';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '30.622.655/0001-62';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '30.620.400/0001-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '065.728.155-79';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.708.179/0001-64';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.170.193/0001-05';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '16.842.452/0001-50';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '051.045.481-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.976.831/0001-43';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '22.018.852/0001-49';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '18.359.957/0001-94';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.139.940/0001-17';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.945.105/0001-74';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '41.293.573/0001-38';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '21.246.295/0002-31';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '31.898.952/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.615.684/0001-58';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '33.899.626/0001-30';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '36.257.682/0001-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '47.815.842/0001-65';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '017.230.995-62';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '26.933.231/0001-41';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '44.517.868/0001-39';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '23.064.906/0001-75';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '23.142.898/0001-38';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '501.407.445-68';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '00.893.166/0001-84';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '53.275.747/0001-19';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.366.155/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '41.922.796/0001-17';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '43.085.099/0001-84';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '811.450.475-72';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '36.438.525/0001-50';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '039.258.337-22';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.564.554/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '45.880.277/0001-94';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '50.011.168/0001-70';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '40.382.153/0001-65';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '38.222.752/0001-70';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '47.808.664/0001-45';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '47.968.909/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '48.060.758/0001-41';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '43.978.175/0001-80';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.617.984/0001-73';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '17.623.263/0001-50';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '51.570.330/0001-53';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '66.333.149/0001-09';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '22.765.108/0001-08';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '05.410.514/0001-39';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '51.901.463/0001-65';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '45.959.077/0001-21';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '025.780.735-70';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.170.732/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '03.010.384/0007-07';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '44.050.050/0001-59';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '27.436.477/0001-70';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.511.059/0004-15';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.511.059/0005-04';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '31.507.158/0001-86';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '31.889.031/0002-50';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '29.058.268/0001-66';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '00.729.385/0001-22';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '27.138.903/0001-90';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '49.527.426/0001-97';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '50.300.158/0001-55';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '18.491.618/0001-67';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '12.614.984/0001-80';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '008.845.685-47';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.510.364/0001-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '13.749.726/0001-73';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.279.821/0001-20';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.078.600/0001-12';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '365.783.475-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '50.262.319/0001-63';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '041.608.915-19';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '39.970.577/0001-61';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '23.014.455/0001-61';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '718.546.145-68';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '41.209.936/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '50.795.049/0001-56';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '20.394.678/0001-03';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '40.874.433/0001-90';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.737.933/0001-05';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '27.178.035/0001-71';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.828.747/0001-82';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.844.518/0001-23';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.928.075/0222-50';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.928.075/0255-18';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.928.075/0203-97';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.928.075/0243-84';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.928.075/0173-37';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.928.075/0245-46';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.928.075/0161-01';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.928.075/0178-41';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.928.075/0196-23';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.129.260/0021-24';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '27.531.054/0001-30';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '13.215.448/0001-74';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.993.499/0001-95';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '57.277.243/0001-99';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.879.407/0001-27';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.960.434/0001-20';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.723.624/0002-79';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '51.006.766/0001-14';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '18.044.517/0001-48';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '53.138.518/0001-52';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '46.240.387/0001-54';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '043.212.775-58';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '482.527.515-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '137.443.177-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '674.075.105-63';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '017.157.325-02';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '26.265.242/0001-09';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '027.199.895-41';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '419.538.944-53';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '25.423.944/0001-00';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '567.135.765-91';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '25.206.112/0001-24';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '27.158.289/0001-28';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.402.244/0001-29';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '813.176.545-87';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.016.132/0001-23';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '60.441.280/0001-03';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '23.699.236/0001-63';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '61.294.661/0001-61';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '734.866.715-53';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.856.540/0001-11';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '17.300.983/0001-84';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '57.913.552/0001-08';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.040.394/0001-23';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '62.777.283/0002-10';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '73.645.541/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '293.880.235-87';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '329.906.185-20';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '38.346.705/0001-38';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '15.147.289/0001-43';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '041.314.175-61';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.423.138/0001-42';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '799.146.325-72';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.742.216/0001-19';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.673.176/0001-65';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.673.176/0003-27';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.673.176/0004-08';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '33.469.938/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '48.504.936/0001-86';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '44.143.905/0001-96';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '036.040.955-57';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.527.978/0001-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '58.911.293/0001-49';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '39.585.852/0001-23';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '29.559.318/0001-99';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '858.521.605-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.546.923/0001-30';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.473.082/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '610.665.757-20';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.575.824/0001-76';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '45.223.780/0001-77';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '63.201.123/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '21.226.622/0001-02';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '24.933.265/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '36.315.261/0001-48';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '18.200.743/0001-70';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '33.058.818/0001-14';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '14.595.972/0001-80';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '41.275.008/0001-48';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '22.820.125/0001-09';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '025.085.455-46';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.960.885/0001-90';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '18.594.579/0001-23';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '24.012.455/0001-95';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '39.887.337/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '16.378.358/0001-92';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '315.017.965-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '036.510.765-47';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '25.002.763/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '10.565.675/0001-31';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '46.970.197/0001-92';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.228.084/0001-64';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '31.889.015/0001-86';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '30.124.305/0001-76';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.022.406/0001-94';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '50.710.922/0001-60';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '25.266.197/0001-36';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '12.029.529/0001-17';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '858.314.705-12';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '10.869.696/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '26.529.581/0001-47';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '55.954.288/0001-25';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '61.744.938/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '49.299.346/0001-21';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '38.125.691/0001-22';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.951.554/0001-84';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '966.641.857-68';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '27.549.389/0001-85';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '08.934.264/0001-24';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '50.766.009/0001-86';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '22.740.671/0001-21';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '02.929.411/0001-91';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '08.097.419/0001-15';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '38.148.657/0001-73';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '10.613.831/0001-92';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '12.239.837/0001-77';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.851.762/0001-03';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '054.340.755-10';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '33.018.098/0001-63';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '49.963.778/0001-95';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '48.206.201/0001-76';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '11.469.862/0001-84';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '57.197.373/0001-11';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '16.870.018/0001-84';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.753.571/0001-81';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.942.307/0002-01';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '23.808.416/0001-36';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '14.473.766/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '15.513.165/0001-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.317.470/0002-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '623.932.865-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '26.852.278/0001-80';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '45.736.335/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '23.606.416/0001-53';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '369.745.015-87';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '27.631.061/0001-03';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.389.686/0001-76';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '172.197.525-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '981.547.105-87';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '246.806.135-72';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '97.408.421/0001-98';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '254.778.705-91';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '331.227.685-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '523.507.625-72';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '14.853.098/0001-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '14.833.071/0001-80';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '39.342.219/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '026.956.454-30';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '02.324.436/0001-61';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '29.294.026/0001-71';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '12.912.216/0001-02';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '57.276.229/0001-70';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '47.762.530/0001-30';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '14.237.539/0001-73';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '12.672.220/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '252.335.818-25';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.543.270/0001-98';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.543.270/0002-79';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.543.270/0009-45';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.543.270/0010-89';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.543.270/0003-50';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '47.632.585/0001-26';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '25.224.435/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '63.109.824/0001-14';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.602.314/0001-68';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '55.843.112/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '12.711.407/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.894.378/0001-72';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.393.884/0001-03';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '45.478.502/0001-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '24.678.884/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '031.763.965-03';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '56.089.669/0001-56';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.651.592/0001-11';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.750.951/0001-74';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '019.465.808-21';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '03.039.045/0001-68';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '40.555.460/0001-09';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '08.185.057/0001-14';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.206.577/0001-02';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '36.897.663/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '058.528.615-96';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '062.699.875-12';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.668.328/0001-20';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '962.242.075-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '12.941.995/0001-74';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.981.470/0001-23';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '792.096.614-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.677.377/0001-07';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '36.032.467/0001-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '41.967.978/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '43.774.225/0001-08';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.773.271/0001-20';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '081.264.387-97';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '070.419.046-01';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '992.839.305-25';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.203.048/0001-47';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '31.006.726/0001-65';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '45.577.212/0001-74';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '24.444.386/0001-99';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '30.798.046/0001-69';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.231.428/0001-49';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '58.435.011/0001-84';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '26.412.113/0001-98';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.085.096/0001-57';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '46.252.256/0001-97';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '03.342.606/0001-01';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '039.678.035-03';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '028.873.515-32';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.992.649/0002-39';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '44.378.700/0001-90';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '25.245.980/0001-13';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '25.129.618/0001-87';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '27.148.483/0001-22';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '43.091.121/0001-07';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '55.141.516/0001-48';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '031.816.845-62';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '50.510.042/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '38.073.184/0001-92';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '31.990.462/0001-27';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '025.573.187-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '012.586.175-36';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '172.257.445-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '12.921.473/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '139.140.225-15';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '009.144.335-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.391.616/0001-50';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '004.222.045-95';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '48.764.288/0001-05';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.668.302/0001-81';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.009.938/0001-12';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '24.304.971/0001-93';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '064.055.645-09';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.937.380/0001-46';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '098.970.957-48';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '23.455.435/0001-26';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '22.210.950/0001-83';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.380.621/0001-98';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '524.987.275-15';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '027.075.376-16';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '60.208.690/0002-81';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '60.208.690/0001-09';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '30.044.631/0001-73';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '40.254.936/0001-63';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '48.976.061/0001-15';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '29.286.650/0001-27';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.121.709/0001-67';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '10.601.653/0001-80';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '49.044.582/0001-05';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.050.319/0001-25';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '44.463.309/0001-93';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '17.221.115/0001-09';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '45.727.148/0001-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '00.425.113/0001-39';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.764.629/0001-70';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '51.478.222/0001-55';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '26.995.486/0001-39';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '083.102.435-61';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '015.922.225-79';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '53.096.173/0001-11';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '33.632.971/0001-03';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.953.735/0001-14';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.548.486/0032-12';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.483.992/0001-77';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.863.390/0001-33';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.259.819/0001-29';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '065.137.005-15';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '96.759.683/0001-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '000.319.565-13';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '03.478.555/0001-31';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '47.317.155/0001-10';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '48.701.689/0001-08';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '13.964.958/0001-44';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '13.964.958/0002-25';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '12.827.140/0001-17';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '39.473.915/0001-50';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '51.038.923/0001-73';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '040.054.935-21';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '57.497.390/0001-74';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '13.937.550/0001-83';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '54.050.796/0001-16';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '29.416.000/0001-59';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '00.634.341/0001-19';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '11.980.310/0001-36';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '11.803.498/0001-47';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '57.714.413/0001-55';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '22.517.485/0001-28';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '05.410.363/0001-19';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '05.554.065/0001-00';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '104.100.581-49';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '165.834.438-30';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '03.777.298/0001-39';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.163.282/0001-98';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '014.493.887-10';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '44.468.186/0001-83';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '53.108.846/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '66.328.861/0001-01';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '46.602.774/0001-93';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '56.524.930/0001-07';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '03.124.164/0001-19';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '23.682.787/0001-14';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.418.665/0001-31';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '40.033.694/0001-88';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.993.238/0002-56';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.430.553/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '02.854.774/0001-05';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '11.346.348/0001-51';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '61.129.793/0001-38';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '58.443.855/0001-77';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '50.788.914/0001-37';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '26.421.211/0001-91';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '29.988.633/0001-31';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.415.172/0001-12';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '42.090.688/0001-98';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.092.192/0001-22';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '41.865.579/0001-32';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '46.901.160/0001-02';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '21.846.945/0001-07';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.810.640/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '57.268.620/0001-23';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '077.398.515-82';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '11.002.436/0001-36';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '272.062.428-47';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '63.027.495/0001-62';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '968.597.335-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '13.022.818/0001-57';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.712.133/0001-09';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '60.907.765/0001-31';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '14.018.905/0001-01';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '46.693.707/0001-21';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '40.876.172/0006-52';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '40.876.172/0003-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.228.974/0001-13';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '30.230.020/0001-10';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '63.788.801/0001-83';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '20.460.431/0001-48';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.434.559/0001-04';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '13.037.910/0001-90';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '48.849.432/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.306.404/0001-36';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '40.502.774/0001-35';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '36.572.582/0001-28';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.936.345/0001-61';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.668.935/0001-25';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.346.099/0001-05';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.750.129/0001-45';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '27.074.017/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '48.132.274/0002-41';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '20.667.156/0001-38';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.558.700/0001-80';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '51.284.015/0001-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '070.569.886-60';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '839.807.765-49';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.392.355/0001-60';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '51.981.804/0001-50';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '045.092.895-02';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '501.136.665-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '007.636.878-55';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '033.838.425-17';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.641.456/0001-91';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.993.183/0004-07';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0003-35';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0008-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0006-88';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0007-69';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0005-05';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0004-16';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0018-11';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0001-73';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0009-20';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0022-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0023-89';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '965.272.345-20';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.296.145/0001-78';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '039.066.175-99';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.542.541/0001-26';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '09.279.909/0001-03';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '48.456.600/0001-95';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '03.481.508/0001-47';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '09.321.633/0001-76';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '011.247.828-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '01.935.601/0001-59';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '09.568.237/0002-29';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '041.151.885-29';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.540.568/0001-91';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '23.006.016/0001-07';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.650.887/0001-73';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '26.658.693/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.412.602/0001-78';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '31.583.015/0001-53';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.301.844/0001-69';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '02.577.262/0001-49';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '31.935.077/0001-87';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '54.381.711/0001-82';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '20.044.891/0001-95';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '51.647.446/0001-43';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '41.356.543/0001-23';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '05.942.723/0001-23';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '62.559.636/0001-25';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '03.533.776/0001-65';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '53.778.807/0001-16';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.625.819/0001-63';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '18.448.236/0001-50';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '823.611.005-25';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '068.794.075-36';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.965.329/0001-36';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '44.600.654/0001-21';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '48.502.782/0001-93';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '18.041.604/0001-41';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.494.147/0002-52';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '32.494.147/0001-71';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.726.241/0001-73';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '38.755.612/0001-67';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '04.833.949/0001-23';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '37.264.661/0001-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '02.981.715/0002-89';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '63.275.158/0001-94';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.843.068/0001-36';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '49.205.161/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '24.061.770/0001-02';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '11.422.998/0001-39';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '21.246.295/0001-50';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '50.235.461/0001-11';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.975.210/0001-07';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '61.007.048/0001-16';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '00.209.298/0001-44';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '08.571.885/0001-90';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '12.009.237/0001-12';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.511.059/0002-53';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.511.059/0001-72';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.511.059/0003-34';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '00.159.769/0001-57';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0019-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '06.353.864/0020-36';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1)
  WHERE company_id = v_company_id AND document = '00.062.616/0003-59';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.530.304/0001-99';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.530.304/0002-70';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '10.683.024/0001-46';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '29.749.564/0001-03';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '13.097.248/0002-45';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '29.496.637/0001-00';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '43.228.315/0002-84';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '52.275.412/0001-38';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '843.729.825-34';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '13.097.248/0001-64';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '36.824.770/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '839.843.215-20';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '19.666.607/0001-33';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '11.091.083/0001-98';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '47.803.040/0001-35';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '46.277.228/0001-24';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '47.469.609/0001-78';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '07.228.475/0001-89';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '20.685.968/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '22.660.290/0001-32';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '055.589.325-11';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%VITORIA DA CONQUISTA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%' OR legal_name ILIKE '%JUSCELINO BRITO DO NASCIMENTO 97036366591%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.248.609/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '21.349.372/0001-06';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO ORLA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '31.211.043/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%' OR legal_name ILIKE '%66.155.065 MARCELO SANTOS DOS ANJOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '26.763.146/0001-82';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '96.847.744/0001-15';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '02.349.294/0002-78';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '00.516.015/0001-07';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '163.666.798-86';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%EUNAPOLIS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%' OR legal_name ILIKE '%HITALO HORTA BOTELHO REPRESENTAÇÕES LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '34.971.066/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '41.218.409/0001-66';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '45.914.570/0001-25';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '20.260.396/0001-13';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '616.262.605-91';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '51.484.417/0001-08';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ARRAIAL & TRANCOSO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '35.396.197/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '933.068.655-91';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '10.670.138/0002-32';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%SANTA CRUZ CABRALIA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '10.670.138/0003-13';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%' OR legal_name ILIKE '%GRACILIANO RIBEIRO DOS SANTOS%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '209.608.245-53';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '56.339.122/0001-61';

  UPDATE public.customers 
  SET 
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '26.479.454/0001-80';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%BELMONTE%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '46.386.995/0001-71';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%DIEGO RENAN DA SILVA%' OR legal_name ILIKE '%DIEGO RENAN DA SILVA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '20.015.500/0001-04';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '28.531.530/0001-85';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '25.230.023/0001-13';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%ITABUNA%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%CLERSON RAMOS BITTENCOURT%' OR legal_name ILIKE '%CLERSON RAMOS BITTENCOURT%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '09.264.006/0001-40';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%TEIXEIRA DE FREITAS%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%' OR legal_name ILIKE '%PATRICK ADRIANO DOS SANTOS QUEIROZ%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '53.323.974/0001-72';

  UPDATE public.customers 
  SET 
    region_id = (SELECT id FROM public.regions WHERE company_id = v_company_id AND name ILIKE '%PORTO SEGURO BAIRRO%' LIMIT 1),
    sales_rep_id = (SELECT id FROM public.sales_reps WHERE company_id = v_company_id AND (nickname ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%' OR legal_name ILIKE '%TRIBUS COMERCIO E SORVETERIA LTDA%') LIMIT 1)
  WHERE company_id = v_company_id AND document = '10.733.532/0001-91';

END $$;
