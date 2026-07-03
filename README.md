# Estoque Fácil / SL Stock - Plataforma de Gestão Completa 📦

Bem-vindo ao repositório oficial do **Estoque Fácil** (também conhecido como **SL Stock** em seu módulo mobile).
Esta é uma plataforma unificada que conecta as pontas soltas da logística, controle de comodatos e da operação comercial de empresas distribuidoras.

---

## 📚 Sumário
- [Módulo Logístico e WMS](#1-módulo-logístico-e-wms)
- [Módulo Força de Vendas e CRM](#2-módulo-força-de-vendas-crm-e-comodato)
- [Stack Tecnológica](#-stack-tecnológica)
- [Níveis de Acesso e Permissões](#-níveis-de-acesso-e-permissões-rbac)
- [Estrutura do Repositório (Arquitetura)](#-estrutura-do-repositório-arquitetura)
- [Como Rodar o Projeto](#-como-rodar-o-projeto)

---

## ⚙️ 1. Módulo Logístico e WMS

### Operação Logística e Last-Mile
- **Recebimentos e Conferências:** Bipagem para confirmar chegada de material de fornecedores e auditoria cega de estoque.
- **Cargas e Entregas (Outbound):** Montagem visual de rotas de entrega baseadas nas notas fiscais/pedidos.
- **App do Motorista & Comprovantes (POD):** O motorista visualiza no celular a rota (PWA offline-first). Ele coleta assinaturas na tela do smartphone e as envia para a nuvem como prova de entrega.
- **Liberações Remotas (Alçadas):** Caso o operador bipe um item divergente ou encontre problemas na entrega, o aplicativo pede liberação online. O Gestor vê o alerta no Desktop e aprova remotamente.

### Bloqueio por Planos (SaaS Multi-tenant)
Os recursos logísticos são destravados de acordo com a assinatura de cada empresa:
- **[Bronze]**: Focado no estoque interno (Dashboard, Produtos, Contagens e Recebimento).
- **[Prata]**: Focado em Expedição (Montagem de Cargas/Rotas e Conferência de doca).
- **[Ouro]**: Focado em Last-Mile (App do Motorista, Assinaturas Eletrônicas, Tracking GPS e Histórico de clientes).
- **[Platina]**: Acesso integral a todas as ferramentas (incluindo módulos de Comodato avançados e Força de Vendas premium).

---

## 💼 2. Módulo Força de Vendas, CRM e Comodato

Desenhado para unificar a ponta comercial (vendedores em rota) com o backoffice e a expedição.

### Gestão de Vendas
- **Criação Rápida de Pedidos:** Vendedores montam pedidos filtrando tabelas de preço exclusivas.
- **Catálogo Offline-First:** Toda a estrutura PWA funciona sem internet (App Força de Vendas).
- **Dashboard de Metas:** Painel com metas financeiras versus realizado, curva ABC de positivação, taxa de clientes inativos, gráficos de evolução de vendas em tempo real usando *Tailwind CSS*.

### CRM & Cadastros Base
- **Cadastro Avançado de Clientes:** Vinculação com Regiões, Representantes, Tabelas de Preço, e Controle de Inadimplência. Proteção rigorosa para que Vendedores só vejam seus próprios clientes.
- **Hierarquia Comercial:** Cadastros separados para Vendedores e Representantes com auto-geração de login.

### Gestão de Equipamentos em Comodato
- **Equipamentos e Patrimônios:** Controle rígido de Freezers, Geladeiras e Máquinas em poder dos clientes.
- **Ordens de Serviço (OS):** O vendedor (ou gestor) abre chamados de manutenção para equipamentos defeituosos em campo com geolocalização e fotos da anomalia.

---

## 💻 Stack Tecnológica

- **Frontend Core:** React 19 + TypeScript + Vite.
- **Estilização UI:** Tailwind CSS (v4) + shadcn/ui + Radix Primitives.
- **Offline & Mobile:** PWA (Vite PWA Plugin) + LocalForage / IndexedDB + Service Workers customizados para sincronização background.
- **State Management:** TanStack Query (React Query) + Context API.
- **Backend & Database:** Supabase (PostgreSQL, PostgREST, Row-Level Security, Supabase Auth).
- **Deploy & Infraestrutura:** Vercel (CI/CD Automático via Github).

---

## 🔐 Níveis de Acesso e Permissões (RBAC)

O sistema possui uma estrutura detalhada (`UserPermissions` no banco de dados) e perfis (Roles) principais:

1. **`admin` / `gestor`:** Donos/Gerentes da empresa cliente. Têm acesso total ao dashboard logístico e comercial, criação de regras e aprovação de alçadas.
2. **`vendedor`:** Acesso ao CRM restrito (visualiza somente seus clientes, não pode excluir/editar livremente os clientes) e ao App de Força de Vendas.
3. **`motorista` / `ajudante`:** Acesso bloqueado ao Painel Web. Só acessam o App Mobile para entregas.
4. **`conferente`:** Operação de doca (App Mobile) para bipagem e inventários.

---

## 📁 Estrutura do Repositório (Arquitetura)

Para detalhes mais profundos sobre a engenharia, consulte:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (Em construção/Detalhado)
- [docs/CHANGELOG.md](docs/CHANGELOG.md) (Histórico de lógicas recentes)

---

## 🚀 Como Rodar o Projeto Localmente

1. **Clonar e Instalar Dependências:**
```bash
git clone https://github.com/lucaslopescoruja-debug/gerenciamento.git
cd coletor
npm install
```

2. **Configurar Variáveis de Ambiente:**
Crie o arquivo `.env` na raiz seguindo o `.env.example` e preencha a URL e a API Key anônima do Supabase.

3. **Rodar Ambiente Local:**
```bash
npm run dev
```

4. **Gerar Build de Produção (Teste de PWA):**
```bash
npm run build
npm run preview
```

*(Todos os commits para a branch `main` ativam deploy automatizado na Vercel).*
