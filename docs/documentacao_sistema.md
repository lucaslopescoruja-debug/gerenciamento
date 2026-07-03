# 📦 SL Stock (Estoque Fácil) - Documentação do Sistema

O **SL Stock** (também denominado *Estoque Fácil*) é uma plataforma ERP/WMS SaaS Multitenant completa, projetada para gerenciar operações em Centros de Distribuição (CD), armazéns e logística de última milha (Last-Mile). O sistema se destaca por sua renderização dupla de interface (Modo Moderno vs. Modo Tradicional Windows 2000), mecanismos eficientes de travas duras, liberação remota em tempo real e compilação híbrida nativa para dispositivos móveis.

---

## 🏗️ 1. Arquitetura Tecnológica e Engenharia

A plataforma foi desenvolvida utilizando tecnologias modernas que garantem velocidade, baixo consumo de banda e excelente performance em dispositivos robustos e móveis.

### Core Stack
*   **Frontend**: React 19 + TypeScript + Vite (alta velocidade de compilação e carregamento).
*   **Banco de Dados & Backend BaaS**: Supabase (PostgreSQL).
*   **Estilização**: Tailwind CSS (design responsivo e otimizado).
*   **Roteamento**: React Router DOM v7 com proteção de rotas integrada ao contexto de autenticação.
*   **Estado & Cache**: React Query (`@tanstack/react-query`) para cache dinâmico e sincronização de dados em tempo real.
*   **Leitura/Geração de Arquivos**: Biblioteca `xlsx` para importação e exportação de dados de planilhas.
*   **Exportação de Relatórios**: Biblioteca `jspdf` para compilação e renderização de comprovantes vetoriais em PDF.

### Integração Mobile (Capacitor)
Para rodar nativamente em smartphones e coletores móveis dedicados (Android/iOS):
*   **Wrapper Híbrido**: Capacitor v8 (com os pacotes `@capacitor/core`, `@capacitor/cli`, `@capacitor/app`, `@capacitor/share` e `@capacitor/filesystem`).
*   **Ajuste de Safes Areas**: A interface possui suporte a `viewport-fit=cover` e padding dinâmico via variáveis CSS (`env(safe-area-inset-top/bottom)`) para evitar obstruções sob reentrâncias de câmera (notches) e barras nativas do sistema operacional.
*   **Permissões de Hardware**:
    *   **Android**: Configuração de permissões de Câmera (`android.permission.CAMERA`) para leitura de código de barras em tempo real e Vibração (`android.permission.VIBRATE`) para feedback tátil durante bipe de mercadorias.
    *   **iOS**: Inserção de chaves de permissão explicativa no arquivo `Info.plist` (`NSCameraUsageDescription`) para autorizar o acesso à câmera pela página web rodando no WebView nativo do iOS.

### Segurança e Criptografia
Para mitigar os riscos de segurança sem a necessidade de manter sessões complexas de infraestrutura, o sistema adota:
*   **Criptografia no Cliente**: As senhas dos usuários são transformadas em hash SHA-256 usando a API nativa do navegador (`crypto.subtle`) antes de trafegarem pela rede e serem gravadas/validadas no banco de dados.
*   **Isolamento de Dados (Multitenant)**: Embora a base do PostgreSQL seja unificada, a segurança lógica e a separação entre empresas (tenants) são impostas na camada de aplicação através da amarração do `company_id` em todas as operações e consultas API.
*   **Troca de Senha Obrigatória**: Usuários recém-criados possuem a senha padrão `123456`. Ao fazer o primeiro login, a rota protegida detecta a senha padrão e força o redirecionamento para a tela `/trocar-senha` (e posteriormente `/dashboard`), impedindo o uso do dashboard antes da atualização.

---

## 🗄️ 2. Modelagem do Banco de Dados (Supabase/PostgreSQL)

A modelagem é dividida em duas camadas lógicas: **SaaS Global** e **Tenant Local**.

### A. Camada SaaS Global (Gestão do Ecossistema)

#### `companies` (Empresas Clientes)
Armazena os inquilinos/clientes do sistema.
*   `id` (UUID, PK, Default: `gen_random_uuid()`)
*   `slug` (TEXT, Unique, Not Null) - Identificador da empresa na URL/Login (Ex: `delicius-ba`).
*   `name` (TEXT, Not Null) - Razão Social / Nome Fantasia.
*   `cnpj` (TEXT, Nullable) - Registro comercial.
*   `max_users` (INTEGER, Default: 5) - Limite de usuários ativos.
*   `active` (BOOLEAN, Default: true) - Status de ativação do cliente.
*   `created_at` (TIMESTAMP, Not Null)

#### `company_payments` (Controle Financeiro)
Registra o histórico de mensalidades e status financeiro dos clientes SaaS.
*   `id` (UUID, PK)
*   `company_id` (UUID, FK -> `companies.id`, Cascade)
*   `amount` (DECIMAL(10,2), Not Null) - Valor da mensalidade.
*   `status` (TEXT, Default: 'pendente') - Estados: `'pendente'`, `'pago'`, `'atrasado'`.
*   `due_date` (DATE, Not Null) - Data de vencimento da fatura.
*   `paid_at` (TIMESTAMP, Nullable) - Data do pagamento efetivo.
*   `notes` (TEXT, Nullable)
*   `created_at` (TIMESTAMP)

#### `system_notes` (Mural Administrativo do SaaS)
Notas internas de comunicação compartilhadas entre a equipe do painel Master.
*   `id` (UUID, PK)
*   `author_id` (UUID, FK -> `users.id`)
*   `author_name` (TEXT, Not Null)
*   `content` (TEXT, Not Null)
*   `created_at` (TIMESTAMP)

#### `system_leads` (Solicitações de Contato / Leads)
Contatos comerciais de vendas recebidos através da Landing Page.
*   `id` (TEXT, PK)
*   `name` (TEXT, Not Null) - Nome do solicitante.
*   `email` (TEXT, Not Null) - E-mail para contato.
*   `phone` (TEXT, Not Null) - Telefone/WhatsApp do lead.
*   `message` (TEXT, Nullable) - Detalhes/Observações sobre a operação.
*   `viewed` (BOOLEAN, Default: false) - Status de leitura do administrador Master.
*   `created_at` (TIMESTAMP)

---

### B. Camada Tenant Local (Operações Logísticas)
Todas as tabelas desta camada contêm a coluna `company_id` e chaves estrangeiras apropriadas.

#### `users` (Funcionários / Operadores)
Controle de acessos locais e globais (Master).
*   `id` (UUID, PK)
*   `company_id` (UUID, FK -> `companies.id`, Nullable para Admins Globais)
*   `is_super_admin` (BOOLEAN, Default: false) - Define se o usuário pertence à equipe Master do SaaS.
*   `name` (TEXT, Not Null)
*   `username` (TEXT, Not Null, Unique)
*   `password_hash` (TEXT, Not Null)
*   `role` (TEXT, Not Null) - Perfis: `'admin'`, `'gestor'`, `'conferente'`, `'motorista'`.
*   `active` (BOOLEAN, Default: true)
*   `permissions` (JSONB, Not Null) - Flags granulares de funcionalidade.
*   `created_at` (TIMESTAMP)

#### `products` (Catálogo de Mercadorias)
*   `id` (UUID, PK)
*   `company_id` (UUID, FK -> `companies.id`, Not Null)
*   `code` (TEXT, Not Null) - SKU / Código do produto.
*   `external_code` (TEXT, Nullable)
*   `description` (TEXT, Not Null)
*   `group_name` (TEXT, Nullable) - Categoria/Grupo de produto.
*   `stock` (NUMERIC, Not Null, Default: 0) - Estoque atual.
*   `min_stock_alert` (INTEGER, Default: 0) - Limite de estoque para alerta visual.
*   `batch` (TEXT, Nullable) - Lote.
*   `unit_weight` (NUMERIC, Nullable) - Peso unitário.
*   `box_quantity` (NUMERIC, Nullable) - Multiplicador de embalagem (Ex: caixa com 12).
*   *Restrição*: Unique combinando `(company_id, code)` para garantir SKU exclusivo por empresa.

#### `operations` (Documentos de Movimentação)
Registra o cabeçalho de cargas, recebimentos e inventários.
*   `id` (UUID, PK)
*   `company_id` (UUID, FK)
*   `type` (TEXT, Not Null) - Tipos: `'LOAD'` (Expedição), `'INVENTORY'` (Inventário), `'BLIND_RECEIPT'` / `'RECEIPT'` (Recebimento).
*   `status` (TEXT, Not Null) - Status: `'pending'`, `'in_progress'`, `'dispatched'`, `'completed'`, `'cancelled'`.
*   `load_number` (TEXT, Nullable) - Identificador numérico da carga (romaneio).
*   `driver_name` (TEXT, Nullable)
*   `vehicle_plate` (TEXT, Nullable)
*   `notes` (TEXT, Nullable)
*   `created_at` (TIMESTAMP)

#### `operation_items` (Itens de Movimentação)
Controle quantitativo previsto versus realizado.
*   `id` (UUID, PK)
*   `company_id` (UUID, FK)
*   `operation_id` (UUID, FK -> `operations.id`)
*   `product_id` (UUID, FK -> `products.id`)
*   `product_code` (TEXT, Not Null)
*   `description` (TEXT, Not Null)
*   `quantity_expected` (NUMERIC, Not Null) - Quantidade planejada.
*   `quantity_scanned` (NUMERIC, Not Null, Default: 0) - Quantidade bipada.
*   `status` (TEXT, Default: 'pending') - Estados: `'pending'`, `'ok'`, `'divergent'`.

#### `delivery_routes`, `delivery_clients` & `delivery_items` (Módulo Last-Mile)
Tabelas específicas para controle das paradas do motorista em trânsito e conferências em cliente:
*   `delivery_routes`: Mapeia a rota do motorista vinculada a uma operação (`LOAD`).
*   `delivery_clients`: Paradas físicas do caminhão. Contém campos para assinatura digital (`signature_data` em Base64), nome do recebedor (`receiver_name`) e coordenadas.
*   `delivery_items`: Mercadorias a serem conferidas na porta do cliente. Possui campos de aprovação remota (`approval_status` como `'approved' | 'pending' | 'rejected'`, e `requested_qty` para solicitações de excedente).

#### `inventory_counts` & `inventory_count_items` (Auditoria e Ajuste)
Mapeia as contagens de inventário oficial do armazém e logs de divergência para conciliação física e contábil.

---

## 🎨 3. Motor de Temas e UI Dupla (Moderno vs. Tradicional)

Uma das maiores inovações de usabilidade do **SL Stock** é o sistema de renderização dupla no frontend. O operador pode alternar o layout de acordo com o dispositivo utilizado:

### 1. Modo Moderno (Padrão)
*   **Estética**: Inspirada no Glassmorphism moderno. Blur de fundo, gradientes vibrantes, bordas arredondadas e sombras neon.
*   **Foco**: Administradores e gestores acessando de desktops modernos, notebooks ou smartphones potentes.

### 2. Modo Tradicional (Retro - Windows 2000 Style)
*   **Estética**: Cinza clássico (`#d4d0c8`), fontes pixeladas Tahoma/MS Sans Serif, bordas retas (Radius zero), botões com sombreamento "Bevel" chanfrado tridimensional simulando botões do Windows 95/2000.
*   **Foco**: Coletores de dados dedicados (Zebra, Honeywell, Datalogic) ou celulares Android antigos.
*   **Engenharia de Performance**: Este modo desativa via CSS e JS todos os efeitos de blur, sombras dinâmicas, gradientes complexos e animações por GPU. Isso reduz drasticamente o consumo de bateria, reduz o uso de CPU no navegador portátil a quase zero e elimina o "lag" de renderização na bipagem contínua.

---

## 📦 4. Mapeamento de Funcionalidades por Módulo

### 🏢 A. Painel Master (Administração SaaS)
Acessado pela URL `/saas` por usuários com a flag `is_super_admin = true`.
1.  **Gestão de Inquilinos (Empresas)**: Cadastro de empresas, definição do slug de login, CNPJ, dia de vencimento, mensalidade e limite de contas de usuários (`max_users`).
2.  **Impersonate (Acesso Direto)**: Botão "Acessar" para entrar diretamente no painel interno do inquilino para dar suporte técnico e visualizar operações locais, redirecionando-o de forma segura para o `/dashboard`.
3.  **Financeiro SaaS**: Controle de faturamento mensal e recebíveis. Se uma fatura permanecer pendente por mais de 5 dias após o vencimento, o sistema bloqueia temporariamente o login operacional da empresa.
4.  **Mural Compartilhado**: Bloco de notas persistente no banco de dados para troca de informações operacionais internas da equipe SaaS.
5.  **Módulo de Leads**:
    *   Exibe no cabeçalho superior do painel (exclusivo para Master) um badge com ícone de usuários e selo roxo pulsante indicando novas solicitações de contato pendentes de visualização.
    *   Listagem completa de contatos, destacando novos leads com a etiqueta `"Novo"`.
    *   Ao carregar a tela de leads por 1.5s, o sistema automaticamente marca os novos contatos como lidos e atualiza o badge superior.
    *   Possui atalhos para resposta por e-mail e abertura direta de chat no WhatsApp do cliente comercial.

### 🏭 B. Módulo de Recebimento de Mercadorias (Inbound)
Focado no recebimento físico de fornecedores na doca de entrada.
1.  **Criação de expectativa**: O gestor cria um documento de recebimento inserindo os códigos e quantidades esperadas ou importando uma planilha do ERP.
2.  **Bipagem às Cegas (Blind Receipt)**: No fluxo de entrada do aplicativo móvel, o conferente tem liberdade operacional. Caso chegue um produto não listado na expectativa ou uma quantidade maior que a planejada, o excesso é gravado como "divergência aceita" para não paralisar o recebimento físico.

### 🚛 C. Módulo de Expedição e Entregas Last-Mile (Outbound)
Responsável pela triagem de saída de cargas e controle das rotas dos motoristas.
1.  **Conferência de Expedição (Travas Duras)**: Ao bipar as mercadorias que estão subindo no caminhão, o operador é impedido de bipar produtos fora da lista ou em quantidades maiores que o pedido.
2.  **Solicitação de Liberação**: Caso o conferente ou motorista precise carregar um produto excedente, o app bloqueia a tela e permite enviar uma solicitação com a quantidade excedente desejada.
3.  **Liberações Remotas (Alçadas de Gestão)**: O gestor administrativo visualiza em tempo real um painel de alertas com as solicitações pendentes (`/liberacoes`). Ele pode aprovar ou rejeitar à distância. Se aprovado, a tela do operador no celular destrava instantaneamente para concluir o carregamento.
4.  **App do Motorista (Entregas)**:
    *   O motorista acessa sua conta e visualiza sua rota ativa no celular.
    *   O motorista clica na parada do cliente, bipa os produtos que estão sendo descarregados na porta e confirma as quantidades.
    *   **POD (Proof of Delivery)**: O motorista colhe a assinatura do cliente na tela do celular (usando canvas de desenho digital), preenche o nome e documento do recebedor e finaliza a entrega.
5.  **Comprovante de Entrega em PDF (jspdf)**:
    *   Permite a exportação e compartilhamento de um PDF estruturado de alta qualidade contendo dados do cliente, itens da entrega (previsto/conferido), dados do recebedor e imagem vetorial da assinatura digital colhida no ato.
    *   **Cabeçalho Otimizado**: Exibe o nome do emitente (empresa conectada), o CNPJ e o número do pedido no cabeçalho superior do arquivo, eliminando seções repetitivas no corpo para economizar espaço de impressão.
    *   Tratamento para quebras de linhas de descrições e nomes de clientes muito longos para evitar sobreposições de layout.
    *   Aciona o compartilhamento nativo em smartphones e downloads em desktops.

### 👥 D. Controle de Acessos da Empresa (RBAC Local)
Dentro de cada empresa (tenant), o administrador define permissões granulares:
*   **Perfis**: Admin (permissões irrestritas), Gestor, Conferente e Motorista.
*   **Permissões específicas**:
    *   `can_view_dashboard`: Visualização de gráficos financeiros e operacionais.
    *   `can_manage_loads`: Criar e excluir rotas de entrega e cargas.
    *   `can_do_conference`: Acesso à área de bipagem de inbound/outbound.
    *   `can_manage_products`: Cadastro, edição e deleção de produtos.
    *   `can_manage_users`: Cadastro e edição da equipe local da empresa.
    *   `can_do_delivery`: Acesso ao painel e aplicativo do motorista.

### 📊 E. Módulo de Contagens (Auditoria de Estoque)
Oferece ferramentas para manter a precisão do estoque.
1.  **Contagem Avulsa (Auditoria Rápida)**: O operador bipa produtos em uma determinada prateleira ou setor sem necessidade de um documento pré-existente. Gera um relatório comparativo em Excel e não altera os saldos de estoque do sistema.
2.  **Contagem de Inventário (Oficial)**: Abertura de uma sessão oficial de inventário (global ou por setor). Os operadores bipam as mercadorias físicas, o sistema calcula a diferença e apenas administradores podem clicar em "Ajustar Estoque", reescrevendo os saldos da tabela `products` para corresponder à contagem física.

### ⚠️ F. Controle de Alertas de Estoque Mínimo
Garante que a reposição de produtos seja sinalizada antes do desabastecimento.
1.  **Limite de Alerta Individual**: Durante o cadastro ou edição de produtos, o gestor define a quantidade limite ("Mínimo para Alerta").
2.  **Destaque no Estoque**: Na tabela de listagem de estoque, produtos que operam abaixo do mínimo definido são marcados em vermelho com o Badge `destructive` e mostram o limite configurado (ex: `Mín: 5`).
3.  **Aviso no Dashboard**: O Dashboard principal calcula em tempo real o volume de produtos operando abaixo do limite definido por empresa e apresenta um card de aviso pulsante destacado no topo da tela com acesso direto para auditoria rápida.
