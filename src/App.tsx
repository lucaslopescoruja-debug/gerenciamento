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
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

// Protected Route Wrapper
function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Placeholder for Inventory
function Inventory() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h2 className="text-2xl font-bold gradient-text mb-2">Módulo de Inventário</h2>
      <p className="text-muted-foreground max-w-md">
        Este módulo gerencia contagens físicas, estoque teórico e estrutura do armazém. Em desenvolvimento.
      </p>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cargas" element={<AllLoads />} />
            <Route path="/nova-carga" element={<CreateLoad />} />
            <Route path="/editar-carga/:id" element={<CreateLoad />} />
            <Route path="/conferencia/:id" element={<Conference />} />
            <Route path="/comprovante/:id" element={<DeliveryProof />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/acesso" element={<AccessControl />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
