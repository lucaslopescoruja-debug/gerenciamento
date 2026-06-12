# Estoque Fácil (Coletor IA) - Plataforma de Gestão Completa 📦

O **Estoque Fácil** (antigo Coletor IA) evoluiu para uma plataforma unificada que conecta as pontas soltas da logística e da operação comercial de empresas distribuidoras. Trata-se de um sistema **SaaS (Software as a Service) Multitenant**, ou seja, atende várias empresas isolando os dados de cada cliente dentro da mesma infraestrutura.

O sistema provê três grandes pilares:
1. **Painel Master (SaaS):** A gestão do "Dono do Software", para faturamento e gestão das empresas clientes.
2. **Logística (ERP/WMS):** Toda a operação de centro de distribuição, contagem, conferência e rotas de entrega.
3. **Força de Vendas (CRM/Vendas):** O módulo focado nos vendedores e representantes comerciais, unificando a cadeia (venda → separação → entrega).

---

## 🏢 1. Arquitetura Multitenant e Painel Master (SaaS)

A plataforma utiliza um modelo "Multitenant" na camada de aplicação. Todo registro de cliente possui um `company_id`.

### Permissões do Master (`is_super_admin: true`)
Existe um nível global supremo. A equipe "Master" enxerga os dados do SaaS, mas as empresas clientes nunca enxergam as outras.

#### Funcionalidades Exclusivas do Master (`/saas`):
- **Gestão de Empresas:** Cadastro de clientes vinculando o CNPJ automaticamente como Slug, definição de limite máximo de usuários (`max_users`) e botão "Impersonate" para acessar o painel do cliente sem pedir senha.
- **Planos Dinâmicos e Financeiro:** A plataforma possui planos escaláveis (Bronze, Prata e Ouro). Há uma tabela dinâmica de preços (`saas_plans`) e geração de faturas. Pagamentos em atraso geram bloqueio automático da empresa no 6º dia de atraso.
- **Equipe SaaS e Anotações:** Gestão da equipe interna do SaaS e um mural de recados/bloco de notas global.

---

## ⚙️ 2. Funcionalidades Logísticas e Cadastros (Empresa Cliente)

### Bloqueio por Planos (Feature Toggling)
Os recursos são destravados conforme a assinatura do cliente:
- **[Bronze]**: Focado no estoque interno. Libera apenas Dashboard, Produtos, Contagens e Recebimento.
- **[Prata]**: Focado em Expedição. Libera montagem de Cargas/Rotas e Conferência de doca.
- **[Ouro]**: Focado em Last-Mile. Libera App do Motorista, Assinatura na tela, Tracking e Histórico de clientes.

### Operação Logística
- **Recebimentos:** Bipagem para confirmar chegada de material de fornecedores.
- **Cargas e Entregas (Outbound):** Montagem visual de rotas.
- **App do Motorista & Comprovantes (POD):** O motorista visualiza no celular a rota. Ele coleta assinaturas na tela do smartphone e as envia como prova de entrega.
- **Liberações Remotas (Alçadas):** Se o operador bipar um item divergente, o app pede liberação online. O Gestor ou Admin verá um alerta na tela do Desktop e aprovará ou rejeitará o erro de longe.

### CRM & Cadastros Base
O sistema agora possui um núcleo base robusto para faturamento e pedidos:
- Gestão completa de **Clientes**.
- Gestão de **Representantes** e **Vendedores** (com criação automática de login).
- Gestão de **Regiões**, **Tabelas de Preços** e **Condições de Pagamento**.
- Configurações de API Key para integrações ERP (ex: Maxiprod).

---

## 💼 3. Força de Vendas (Sales App)

O mais recente e poderoso módulo do Estoque Fácil, desenhado para fechar o ciclo desde a ponta comercial.

### Gestão Comercial
- **Visualização de Pedidos e Orçamentos:** Tela Desktop ultrarrápida, desenhada aos moldes do Mercos, com visão em funil.
- **Painel de Acompanhamento:** Rascunhos de pedidos geram alertas para os vendedores concluírem o funil.
- **Pedidos Via Inteligência Artificial (Em breve):** Preparação da infraestrutura para o vendedor criar pedidos conversando no WhatsApp.
- **Filtros e Relatórios:** Rastreabilidade se o pedido foi faturado, cancelado ou está em rota, pois a força de vendas conversa com o módulo Logístico de forma nativa.

---

## 🎨 UI/UX e Frontend

O sistema foi desenhado para causar o famoso "Efeito Uau", fugindo dos ERPs cinzas tradicionais.

### Dupla Identidade Visual (Temas)
- **Modo Moderno (Padrão):**
  - Blur, Transparências, Glassmorphism. Dashboard interativo, notificações inteligentes e esquema de cores baseados em semântica nativa da marca.
  - Tela de login revolucionária estilo "Split Screen" (marketing de um lado, acesso do outro).
- **Modo Tradicional (Windows 2000):**
  - Foco em rodar leve em coletores de rádiofrequência (Zebra, Honeywell) e celulares antigos. Corta transparências e processamento visual para zero lag de bipagem.

---

## 🗄️ Arquitetura do Banco de Dados (Supabase / Postgres)

### Camada Global (SaaS)
- **`companies`**: `id`, `name`, `cnpj` (usado como slug), `max_users`, `plan`, `active`.
- **`saas_plans`**: Tabela de preços base do Software.
- **`company_payments`**: Controle financeiro para as assinaturas das empresas clientes.

### Camada Local (Tenant)
Tabelas que operam isoladas por `company_id`.
- **`users`**: RBAC (Roles: Administrador, Gestor, Conferente, Motorista, Vendedor).
- **`products`** e **`price_tables`**: Base para formação de preços do Força de Vendas.
- **`operations`**, **`operation_items`**: O coração das rotas, inventários e recebimentos.
- **`delivery_routes`** & **`delivery_clients`** & **`delivery_items`**.

---

## 🚀 Como Rodar o Projeto

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

*(Todos os commits para a branch `main` ativam deploy automatizado na Vercel).*
