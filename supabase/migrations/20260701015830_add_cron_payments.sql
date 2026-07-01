-- 1. Cria a função que gera as mensalidades
CREATE OR REPLACE FUNCTION generate_company_payments() RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comp RECORD;
    v_today DATE := CURRENT_DATE;
    v_candidate_date DATE;
    v_due_date DATE;
    v_days_remaining INT;
    v_last_day INT;
    i INT;
BEGIN
    FOR v_comp IN 
        SELECT id, created_at, monthly_fee, billing_day 
        FROM companies 
        WHERE active = true AND monthly_fee > 0 AND billing_day IS NOT NULL
    LOOP
        -- Testar mês passado (-1), mês atual (0) e próximo mês (1)
        FOR i IN -1..1 LOOP
            v_candidate_date := v_today + (i || ' month')::interval;
            
            -- Pegar o último dia do mês corrente no loop
            v_last_day := EXTRACT(DAY FROM (date_trunc('month', v_candidate_date) + interval '1 month - 1 day'));
            
            -- Calcular a data de vencimento
            v_due_date := date_trunc('month', v_candidate_date) + 
                          ((LEAST(v_comp.billing_day, v_last_day) - 1) || ' days')::interval;
                          
            IF v_due_date >= v_comp.created_at::DATE THEN
                v_days_remaining := v_due_date - v_today;
                
                -- Se faltar 7 dias ou menos para vencer
                IF v_days_remaining <= 7 THEN
                    -- Verificar se já existe a cobrança
                    IF NOT EXISTS (
                        SELECT 1 FROM company_payments 
                        WHERE company_id = v_comp.id AND due_date = v_due_date
                    ) THEN
                        -- Inserir nova cobrança
                        INSERT INTO company_payments (company_id, amount, due_date, status, notes)
                        VALUES (
                            v_comp.id, 
                            v_comp.monthly_fee, 
                            v_due_date, 
                            'pendente', 
                            'Gerado automaticamente pelo sistema (Mensalidade)'
                        );
                    END IF;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

-- 2. Ativar a extensão do pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Remover algum agendamento antigo se existir com esse nome (ignorar erro caso não exista)
DO $$
BEGIN
    PERFORM cron.unschedule('generate_monthly_payments');
EXCEPTION WHEN OTHERS THEN
    -- Não faz nada se não existir
END $$;

-- 4. Criar o agendamento para 09:00 UTC (06:00 BRT)
SELECT cron.schedule('generate_monthly_payments', '0 9 * * *', 'SELECT generate_company_payments()');
