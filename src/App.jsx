import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Loading } from './components/UI'

// Pages
import {
  Login,
  Dashboard,
  Associados,
  Vendas,
  Planos,
  Comissoes,
  ResumoRevendedores,
  Renovacoes,
  Pagamentos,
  Configuracoes,
  Perfil,
  GerarPix,
  VerificarVenda,
  LogsPix,
  MeuPlano,
  PagarContas,
  SolicitacoesPagamento
} from './pages'

// Componente de rota protegida
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth()
  
  if (loading) {
    return <Loading message="Verificando autenticação..." />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

// Componente de rota pública (redireciona se já logado)
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <Loading message="Carregando..." />
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Rota pública - Login */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      {/* Rotas protegidas - Todos os usuários */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/vendas" 
        element={
          <ProtectedRoute>
            <Vendas />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/perfil" 
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/gerar-pix" 
        element={
          <ProtectedRoute>
            <GerarPix />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/verificar-venda" 
        element={
          <ProtectedRoute>
            <VerificarVenda />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/logs-pix" 
        element={
          <ProtectedRoute>
            <LogsPix />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/meu-plano" 
        element={
          <ProtectedRoute>
            <MeuPlano />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/pagar-contas" 
        element={
          <ProtectedRoute>
            <PagarContas />
          </ProtectedRoute>
        } 
      />
      
      {/* Rotas protegidas - Apenas Admin */}
      <Route 
        path="/associados" 
        element={
          <ProtectedRoute adminOnly>
            <Associados />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/planos" 
        element={
          <ProtectedRoute adminOnly>
            <Planos />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/comissoes" 
        element={
          <ProtectedRoute adminOnly>
            <Comissoes />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/resumo-revendedores" 
        element={
          <ProtectedRoute adminOnly>
            <ResumoRevendedores />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/renovacoes" 
        element={
          <ProtectedRoute adminOnly>
            <Renovacoes />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/solicitacoes-pagamento" 
        element={
          <ProtectedRoute adminOnly>
            <SolicitacoesPagamento />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/pagamentos" 
        element={
          <ProtectedRoute adminOnly>
            <Pagamentos />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/configuracoes" 
        element={
          <ProtectedRoute>
            <Configuracoes />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirecionar raiz para gerar-pix (para revendedores) ou dashboard (para admin) */}
      <Route path="/" element={<Navigate to="/gerar-pix" replace />} />
      
      {/* 404 - Redirecionar para gerar-pix */}
      <Route path="*" element={<Navigate to="/gerar-pix" replace />} />
    </Routes>
  )
}

export default App
