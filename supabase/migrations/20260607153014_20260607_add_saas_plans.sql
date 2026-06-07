-- Tabela global de preços dos planos (SaaS)
CREATE TABLE IF NOT EXISTS saas_plans (
  id VARCHAR(50) PRIMARY KEY, -- 'bronze', 'prata', 'ouro'
  name VARCHAR(100) NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  base_users INTEGER NOT NULL DEFAULT 1,
  extra_user_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir os planos padrão com os novos IDs
INSERT INTO saas_plans (id, name, base_price, base_users, extra_user_price)
VALUES 
  ('bronze', 'Bronze', 197.00, 3, 35.00),
  ('prata', 'Prata', 497.00, 7, 50.00),
  ('ouro', 'Ouro', 1290.00, 10, 100.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  base_users = EXCLUDED.base_users,
  extra_user_price = EXCLUDED.extra_user_price;

-- Caso você já tenha rodado o código antigo que inseria 'basico', 'profissional' e 'enterprise', 
-- podemos remover os antigos (cuidado, se alguma empresa já estava vinculada, precisaríamos dar UPDATE nelas antes)
DELETE FROM saas_plans WHERE id IN ('basico', 'profissional', 'enterprise');
