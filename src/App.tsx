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
import { ThemeProvider } from './components/ThemeProvider'
import ChangePassword from './pages/ChangePassword'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { DEFAULT_PASSWORD_HASH } from './utils/crypto'

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
  if (!company && isMaster && location.pathname !== '/saas') {
    return <Navigate to="/saas" replace />;
  }

  // Se o usuário estiver com a senha padrão e não estiver na tela de troca de senha, redireciona
  if (user.password_hash === DEFAULT_PASSWORD_HASH && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }
  
  // Se ele já trocou a senha e tenta acessar a tela de troca, joga pro dashboard
  if (user.password_hash !== DEFAULT_PASSWORD_HASH && location.pathname === '/trocar-senha') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

import CountsMenu from './pages/Counts'
import AdhocCount from './pages/Counts/AdhocCount'
import InventoryCount from './pages/Counts/InventoryCount'

import ReceiptsList from './pages/Receipts/index'
import CreateReceipt from './pages/Receipts/CreateReceipt'

import DeliveriesList from './pages/Deliveries/index'
import CreateDelivery from './pages/Deliveries/CreateDelivery'
import RouteClients from './pages/Deliveries/RouteClients'
import ClientConference from './pages/Deliveries/ClientConference'
import SignaturePad from './pages/Deliveries/SignaturePad'
import ApprovalsPage from './pages/Approvals'
import ClientHistory from './pages/ClientHistory'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/trocar-senha" element={<ChangePassword />} />
          
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cargas" element={<AllLoads />} />
            <Route path="/nova-carga" element={<CreateLoad />} />
            <Route path="/editar-carga/:id" element={<CreateLoad />} />
            <Route path="/conferencia/:id" element={<Conference />} />
            <Route path="/comprovante/:id" element={<DeliveryProof />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/contagens" element={<CountsMenu />} />
            <Route path="/contagens/avulsa" element={<AdhocCount />} />
            <Route path="/contagens/inventario" element={<InventoryCount />} />
            
            {/* Receipts Routes */}
            <Route path="/recebimentos" element={<ReceiptsList />} />
            <Route path="/recebimentos/novo" element={<CreateReceipt />} />
            <Route path="/recebimentos/editar/:id" element={<CreateReceipt />} />
            
            {/* Deliveries Routes */}
            <Route path="/entregas" element={<DeliveriesList />} />
            <Route path="/entregas/nova" element={<CreateDelivery />} />
            <Route path="/entregas/:id" element={<RouteClients />} />
            <Route path="/entregas/cliente/:clientId" element={<ClientConference />} />
            <Route path="/entregas/cliente/:clientId/assinatura" element={<SignaturePad />} />

            {/* Approvals Route */}
            <Route path="/liberacoes" element={<ApprovalsPage />} />
            <Route path="/historico" element={<ClientHistory />} />

            <Route path="/acesso" element={<AccessControl />} />
            <Route path="/saas" element={<MasterPanel />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
