# Coletor IA - Sistema de Logística Inteligente & SaaS 📦

O **Coletor IA** (ou Estoque Fácil) é um sistema completo tipo ERP / WMS focado na operação em Centros de Distribuição (CD), e que agora atua como uma plataforma **SaaS (Software as a Service) Multitenant**. 

O sistema provê:
1. **Painel Master (SaaS):** Gestão de clientes (empresas), finanças (mensalidades), equipe interna e avisos globais.
2. **Dashboard de Gestão (Desktop):** Controle em tempo real das rotas, estoque, usuários e aprovações para gestores das empresas clientes.
3. **App do Operador (Mobile-first):** Interface ultrarrápida de bipagem voltada para coletores de dados e smartphones (Android/iOS) na operação física.

---

## 🏗️ Arquitetura e Tecnologias

- **Frontend Core**: React 18 + TypeScript + Vite.
- **Roteamento**: React Router DOM (Rotas protegidas com contexto de Auth).
- **Gerência de Estado/Cache**: React Query (`@tanstack/react-query`).
- **Banco de Dados**: Supabase (PostgreSQL).
- **Estilização**: Tailwind CSS.
- **Ícones**: Lucide React.
- **Exportação/Importação**: `xlsx` (Geração e leitura nativa de planilhas).
- **Segurança**: As senhas são tratadas com `crypto.subtle` (SHA-256) no cliente antes da gravação e validação no backend.

---

## 🏢 Arquitetura Multitenant e Painel Master (SaaS)

A plataforma utiliza um modelo "Multitenant", onde uma única base de dados hospeda diversas empresas (clientes). O isolamento de dados é garantido na camada de aplicação através da vinculação obrigatória de `company_id`.

### Permissões do Master (`is_super_admin: true`)
Existe um nível global e supremo acima dos administradores das empresas. A equipe "Master" não pertence a nenhuma empresa cliente.

#### Funcionalidades Exclusivas do Painel Master (`/master`):
- **Gestão de Empresas:** Cadastro de clientes, definição de slug (identificador), limite máximo de usuários (`max_users`) e botão de Sair/Acessar o painel daquela empresa diretamente (Impersonate).
- **Financeiro:** Controle das mensalidades dos clientes. Lançamento de cobranças. Se um pagamento atrasar por mais de 5 dias corridos do vencimento (`due_date`), **o sistema bloqueia automaticamente** o acesso da empresa inativando-a.
- **Acessos (Equipe SaaS):** Gestão da equipe interna do SaaS com controle granular:
  - `can_manage_saas_clients` (Criar/Editar empresas)
  - `can_manage_saas_finance` (Ver/Editar mensalidades)
  - `can_manage_saas_staff` (Criar/Excluir outros Master admins)
- **Anotações:** Mural de recados / bloco de notas global compartilhado entre a equipe Master.

---

## ⚙️ Funcionalidades Logísticas (Tenant / Empresa Cliente)

### 1. 🏭 Recebimentos (Inbound de Fábrica)
Foco na chegada de mercadorias.
- O gestor cadastra a expectativa de recebimento manualmente ou importando uma planilha.
- **Bipagem às Cegas:** No fluxo de recebimento, o conferente tem autorização para ignorar bloqueios. Se um produto não estava previsto, ou a quantidade exceder, o sistema acata o produto na mesma hora para não travar o fluxo da doca.

### 2. 🚛 Cargas e Entregas (Outbound)
Foco na montagem de romaneios e logística Last-Mile.
- **Conferência de Expedição:** Existem **Travas Duras**. O conferente não consegue carregar itens não listados ou em quantidade superior ao pedido sem autorização.
- **Painel do Motorista:** O motorista visualiza a lista de entregas ordenada no celular.
- **Prova de Entrega (POD):** Coleta de assinatura digital na tela e nome do recebedor físico.

### 3. 🚨 Liberações Remotas (Alçadas de Gestão)
- Se o operador tenta despachar divergências, o app emite um pedido de liberação.
- O Gestor visualizará um alerta na sala administrativa e pode "Aprovar" ou "Rejeitar" à distância, destravando o aplicativo do operador em tempo real.

### 4. 👥 Controle de Acessos da Empresa (RBAC)
Cada funcionário do cliente possui um "Perfil" (Role) e "Permissões Granulares":
- **Perfis Base:** Administrador (Admin), Gestor, Conferente, Motorista.
- **Flags Granulares:**
  - `can_view_dashboard` (Ver métricas e painéis)
  - `can_manage_loads` (Gerenciar rotas e cargas)
  - `can_do_conference` (Bipar na doca)
  - `can_manage_products` (Estoque mestre)
  - `can_manage_users` (Equipe da empresa)
  - `can_do_delivery` (Acesso mobile do motorista)

> **Nota de Segurança:** O botão de "Limpar Estoque Total" é estritamente reservado aos usuários `Master`. Administradores das empresas não podem executar limpezas destrutivas em lote. Todos os novos cadastros ganham a senha padrão "123456" que deve ser alterada no primeiro acesso.

---

## 🎨 Engine de Temas e UI Dupla

O sistema possui uma renderização dupla focada em Performance vs Estética. O botão de tema ("paleta" no menu) cruza os seguintes universos:

**Modo Moderno (Padrão):**
- Blur, Transparências, Glassmorphism, Sombras Neon.
- Botões com gradient e efeitos interativos intensos.

**Modo Tradicional (Windows 2000):**
- Foco em rodar leve em coletores e celulares antigos.
- Cores sólidas (Cinza `#d4d0c8`), bordas retas (Radius: 0) e fonte Tahoma.
- Botões com efeito visual "Bevel" (chanfrado), desativando todo o processamento de animações e GPU pesada no navegador.

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

### Camada Global (SaaS)
- **`companies`**: `id`, `name`, `slug`, `cnpj`, `max_users`, `active`.
- **`company_payments`**: `company_id`, `amount`, `status` (pendente, pago, atrasado), `due_date`, `paid_at`.
- **`system_notes`**: Recados dos Super Admins.

### Camada Local (Tenant)
Tabelas abaixo contém `company_id` referenciando `companies(id)` para isolamento.
- **`users`**: RBAC dos operadores + flag `is_super_admin` e `permissions` em JSONB.
- **`products`**: Tabela mestra de mercadorias.
- **`operations`**: `LOAD` (Carga), `RECEIPT` (Recebimento Inbound), `INVENTORY`.
- **`operation_items`**: Itens atrelados à operação (Qtd Esperada vs Bipada).
- **`delivery_clients`**: Lista de paradas de uma rota.
- **`delivery_items`**: O que desce na parada. Contém `approval_status` controlando a Trava Remota.

---

## 🚀 Scripts e Inicialização

O repositório já contém configuração completa.

1. **Instalar Dependências:**
```bash
npm install
```

2. **Rodar Ambiente Local:**
```bash
npm run dev
```

3. **Gerar Build de Produção:**
```bash
npm run build
```

O ambiente já está conectado diretamente à API Key (`VITE_SUPABASE_ANON_KEY`) e URL (`VITE_SUPABASE_URL`) no Supabase. Todos os `push` na branch `main` ativam o deploy automatizado via Vercel. 

> *Nota técnica sobre o Supabase:* Devido à arquitetura customizada de autenticação baseada em JWT mantida pela própria aplicação no `localStorage`, o *Row Level Security (RLS)* nativo das tabelas SaaS encontra-se desativado (`fix_rls.sql`) para o `anon_key`, sendo a segurança gerida totalmente nas validações lógicas e mutations do React.
