import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import AllLoads from './pages/AllLoads'
import CreateLoad from './pages/CreateLoad'
import Conference from './pages/Conference'
import DeliveryProof from './pages/DeliveryProof'
import Products from './pages/Products'
import AccessControl from './pages/AccessControl'
import Login from './pages/Login'
import MasterPanel from './pages/Master'
import SaaSFinance from './pages/Master/Finance'
import SaaSTeam from './pages/Master/Team'
import SaaSCampanhas from './pages/Master/Campaigns'
import SaaSNotes from './pages/Master/Notes'
import SaaSLeads from './pages/Master/Leads'
import { ThemeProvider } from './components/ThemeProvider'
import ChangePassword from './pages/ChangePassword'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { DEFAULT_PASSWORD_HASH } from './utils/crypto'
import Landing from './pages/Landing'


// Protected Route Wrapper
function ProtectedRoute() {
  const { user, company, isLoading, isMaster } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se for super admin e não tiver empresa selecionada, força ir pro Painel SaaS
  if (!company && isMaster && !location.pathname.startsWith('/saas')) {
    return <Navigate to="/saas" replace />;
  }

  // Se o usuário estiver com a senha padrão e não estiver na tela de troca de senha, redireciona
  if (user.password_hash === DEFAULT_PASSWORD_HASH && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }
  
  // Se ele já trocou a senha e tenta acessar a tela de troca, joga pro dashboard
  if (user.password_hash !== DEFAULT_PASSWORD_HASH && location.pathname === '/trocar-senha') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

import CountsMenu from './pages/Counts'
import AdhocCount from './pages/Counts/AdhocCount'
import PlannedInventoriesList from './pages/Counts/Planned/List'
import PlannedInventoryManager from './pages/Counts/Planned/Manager'
import PlannedInventoryOperator from './pages/Counts/Planned/Operator'

import ReceiptsList from './pages/Receipts/index'
import CreateReceipt from './pages/Receipts/CreateReceipt'

import DeliveriesList from './pages/Deliveries/index'
import CreateDelivery from './pages/Deliveries/CreateDelivery'
import RouteClients from './pages/Deliveries/RouteClients'
import ClientConference from './pages/Deliveries/ClientConference'
import RouteClientForm from './pages/Deliveries/RouteClientForm'
import ReturnConference from './pages/Deliveries/ReturnConference'
import SignaturePad from './pages/Deliveries/SignaturePad'
import ApprovalsPage from './pages/Approvals'
import ClientHistory from './pages/ClientHistory'
import { PlanGuard } from './components/PlanGuard'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/trocar-senha" element={<ChangePassword />} />
          
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cargas" element={<PlanGuard requiredPlan="prata"><AllLoads /></PlanGuard>} />
            <Route path="/nova-carga" element={<PlanGuard requiredPlan="prata"><CreateLoad /></PlanGuard>} />
            <Route path="/editar-carga/:id" element={<PlanGuard requiredPlan="prata"><CreateLoad /></PlanGuard>} />
            <Route path="/conferencia/:id" element={<PlanGuard requiredPlan="prata"><Conference /></PlanGuard>} />
            <Route path="/comprovante/:id" element={<PlanGuard requiredPlan="ouro"><DeliveryProof /></PlanGuard>} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/contagens" element={<CountsMenu />} />
            <Route path="/contagens/avulsa" element={<AdhocCount />} />
            <Route path="/contagens/planejados" element={<PlannedInventoriesList />} />
            <Route path="/contagens/planejados/:id/gestao" element={<PlannedInventoryManager />} />
            <Route path="/contagens/planejados/:id/coleta" element={<PlannedInventoryOperator />} />
            
            {/* Receipts Routes */}
            <Route path="/recebimentos" element={<ReceiptsList />} />
            <Route path="/recebimentos/novo" element={<CreateReceipt />} />
            <Route path="/recebimentos/editar/:id" element={<CreateReceipt />} />
            
            {/* Deliveries Routes */}
            <Route path="/entregas" element={<PlanGuard requiredPlan="ouro"><DeliveriesList /></PlanGuard>} />
            <Route path="/entregas/nova" element={<PlanGuard requiredPlan="ouro"><CreateDelivery /></PlanGuard>} />
            <Route path="/entregas/:id" element={<PlanGuard requiredPlan="ouro"><RouteClients /></PlanGuard>} />
            <Route path="/entregas/:id/novo-cliente" element={<PlanGuard requiredPlan="ouro"><RouteClientForm /></PlanGuard>} />
            <Route path="/entregas/cliente/:clientId/editar" element={<PlanGuard requiredPlan="ouro"><RouteClientForm /></PlanGuard>} />
            <Route path="/entregas/:id/retorno" element={<PlanGuard requiredPlan="ouro"><ReturnConference /></PlanGuard>} />
            <Route path="/entregas/cliente/:clientId" element={<PlanGuard requiredPlan="ouro"><ClientConference /></PlanGuard>} />
            <Route path="/entregas/cliente/:clientId/assinatura" element={<PlanGuard requiredPlan="ouro"><SignaturePad /></PlanGuard>} />

            {/* Approvals Route */}
            <Route path="/liberacoes" element={<ApprovalsPage />} />
            <Route path="/historico" element={<PlanGuard requiredPlan="ouro"><ClientHistory /></PlanGuard>} />

            <Route path="/acesso" element={<AccessControl />} />
            
            {/* SaaS Master Routes */}
            <Route path="/saas" element={<MasterPanel />} />
            <Route path="/saas/empresas" element={<MasterPanel />} />
            <Route path="/saas/financeiro" element={<SaaSFinance />} />
            <Route path="/saas/acessos" element={<SaaSTeam />} />
            <Route path="/saas/campanhas" element={<SaaSCampanhas />} />
            <Route path="/saas/anotacoes" element={<SaaSNotes />} />
            <Route path="/saas/leads" element={<SaaSLeads />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
