# Estoque Fácil - Sistema de Logística Inteligente 📦

O **Estoque Fácil** é um sistema completo tipo ERP / WMS focado na operação em Centros de Distribuição (CD). O sistema provê tanto um Dashboard avançado para Gestores em telas grandes (Desktop) quanto uma interface de bipagem de mercadorias ultrarrápida voltada para dispositivos móveis (Coletores de Dados e Celulares Android/iOS).

O sistema inteiro opera em nuvem com tempo real via integração com **Supabase** e possui hospedagem na **Vercel**.

---

## 🏗️ Arquitetura e Tecnologias
- **Frontend Core**: React 18 + TypeScript + Vite.
- **Roteamento**: React Router DOM (Rotas protegidas).
- **Gerência de Estado/Cache**: React Query (`@tanstack/react-query`). Otimizado para evitar requests desnecessárias e manter a rede sincronizada.
- **Banco de Dados (BaaS)**: Supabase (PostgreSQL).
- **Estilização**: Tailwind CSS.
- **Ícones e Assets**: Lucide React.
- **Manipulação de Planilhas**: `xlsx` (Suporte nativo para gerar Excel e ler dados exportados de sistemas legados, como Sankhya e TOTVS).

---

## ⚙️ Funcionalidades Principais (Módulos)

### 1. 🏭 Recebimentos (Inbound de Fábrica)
Módulo focado na chegada de caminhões de fornecedores ou transferências de fábrica.
- O gestor pode cadastrar a expectativa de recebimento manualmente ou importando uma planilha (Excel).
- Os conferentes na doca logam pelo celular, abrem a operação e realizam a "Bipagem".
- **Bipagem às Cegas:** No fluxo de Recebimento, o sistema possui autorização especial para ignorar bloqueios. Se um produto não estava previsto, ou a quantidade exceder, o sistema acata o produto na mesma hora para não travar o fluxo físico da doca.
- Ao finalizar, o sistema **injetará automaticamente as quantidades recebidas no estoque mestre**, e permitirá o download imediato de um Excel contendo relatórios de divergência.

### 2. 🚛 Cargas e Entregas (Outbound)
Módulo de expedição focado na montagem do caminhão e logística de last-mile (entrega no cliente).
- **Geração de Romaneio:** Importação do romaneio criando uma Operação do tipo "LOAD" (Carga) associada aos clientes da rota.
- **Conferência de Expedição:** Diferente do Inbound, aqui existem **Travas Duras**. O conferente não consegue colocar um item na carga se não estiver no pedido, nem carregar unidades a mais do que a capacidade aprovada, salvo sob liberação remota.
- **Painel do Motorista:** Após a carga ser despachada, o status altera e a Rota cai no celular do Motorista (`/entregas`). O Motorista tem a lista de clientes ordenada.
- **Prova de Entrega (POD):** No ato do descarregamento no cliente, o Motorista colhe uma Assinatura Digital na tela do celular e anota quem recebeu e o documento. 

### 3. 🚨 Liberações Remotas (Alçadas de Gestão)
- Ocasionalmente, há erros ou itens extras a serem enviados em uma entrega ou carga.
- Quando o Motorista tenta lançar um item não listado, o aplicativo retém a operação e dispara um pedido de autorização.
- O Gestor, pelo Dashboard em sua sala, visualizará um alerta em vermelho (`/liberacoes`). Ao clicar em "Aprovar", a tela do Motorista no caminhão destrava instantaneamente liberando a entrega.

### 4. 🔍 Histórico e Pesquisa
- Central de buscas de Comprovantes de Entregas.
- O Gestor pode buscar pela Razão Social do cliente, pelo Número da Carga (ex: VZ 02123) ou até mesmo diretamente pelo **Número do Pedido**.
- A busca retorna cartões compactos mostrando os itens físicos que foram deixados no local e a assinatura original desenhada.

### 5. 📦 Controle de Estoque (Estoque Mestre)
- Listagem global de tudo que há dentro do armazém.
- Botão "Limpar Banco" protegido e oculto exclusivamente para a role (papel) de Administrador do sistema, prevenindo que Gestores ou Motoristas apaguem o banco acidentalmente.

---

## 🎨 Engine de Temas e UI Dupla
O Estoque Fácil possui uma tecnologia de renderização dupla pensada em Performance vs Estética. O botão no cabeçalho (ícone de paleta de cores) permite cruzar os seguintes universos:

**Modo Moderno (Padrão):**
- Utiliza Blur, Transparências, Glassmorphism.
- Sombras Neon emitidas pelos botões.
- Arredondamento alto (Border Radius).
- Efeitos Pulse e gradientes textuais.

**Modo Tradicional (Windows 2000):**
- Para usuários acostumados com sistemas legados (Ou para rodar de forma leve em celulares antigos da Doca).
- Cores sólidas no clássico Cinza da Microsoft (`#d4d0c8`).
- Bordas retas (Radius: 0).
- Textos em preto e fonte Tahoma clássica.
- Botões com efeito visual de "Bevel" chanfrado que afundam fisicamente ao clicar, eliminando todo o processamento de GPU de Blurs e Animações de Sombras.

Ambos os modos acima suportam nativamente variação para Claro/Escuro (Light / Dark mode) controlado pelo botão Sol/Lua.

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

O sistema trabalha com tabelas principais estruturadas via Constraints do PostgreSQL para manter a integridade logística.

- **`products`**: Tabela mestra de mercadorias (Código, Nome, Estoque atual).
- **`operations`**: O coração do sistema. Pode assumir os tipos (Type): `LOAD` (Carga/Envio), `RECEIPT` (Recebimento Inbound), `INVENTORY` (Inventário cego) e `BLIND_RECEIPT`.
- **`operation_items`**: O que há dentro de cada operação (Produto, Quantidade Esperada, Quantidade Bipada e Status do Item).
- **`delivery_clients`**: Lista de clientes de uma Rota Específica, com o status de entrega atrelado a eles (ex: `pending`, `delivered`) e o Número do Pedido de Venda (`order_number`).
- **`delivery_items`**: Mercadorias que descem efetivamente em cada cliente. Possui a coluna `approval_status` (gerenciando a Trava Remota) e `requested_qty`.
- **`users`**: RBAC de Operadores (`admin`, `gestor`, `motorista`, `conferente`). Controla quem pode ver o Dashboard ou quem só vê a tela do Caminhão.

> Importante: As restrições (CHECK constraints) da tabela operations (`operations_type_check`) estão atualizadas para permitir livre criação de entradas da fábrica via tipo `RECEIPT`.

---

## 🚀 Como Iniciar o Projeto (Desenvolvimento)

1. **Instalação das dependências:**
```bash
npm install
```

2. **Rodar localmente:**
```bash
npm run dev
```

3. **Geração do Build de Produção:**
```bash
npm run build
```

O ambiente já está conectado diretamente à API Key e Supabase URL expostos no ambiente. Os deploys de produção ocorrem de maneira automatizada e assíncrona ("Push to Deploy") via repositório Github amarrado à Vercel.
