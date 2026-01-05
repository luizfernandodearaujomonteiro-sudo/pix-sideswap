import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Wallet, 
  BarChart3,
  RefreshCw,
  ClipboardList,
  CreditCard,
  Settings,
  User,
  X
} from 'lucide-react'
import './Sidebar.css'

export function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin } = useAuth()
  
  // Menu para Admin
  const adminMenu = [
    { section: 'Principal', items: [
      { path: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
      { path: '/associados', icon: <Users size={18} />, label: 'Associados' },
      { path: '/vendas', icon: <ShoppingCart size={18} />, label: 'Minhas Vendas' },
      { path: '/comissoes', icon: <Wallet size={18} />, label: 'Comissões' },
      { path: '/resumo-revendedores', icon: <BarChart3 size={18} />, label: 'Resumo Revendedores' },
      { path: '/renovacoes', icon: <RefreshCw size={18} />, label: 'Renovações' },
      { path: '/solicitacoes-pagamento', icon: <CreditCard size={18} />, label: '💳 Pagar Contas' },
    ]},
    { section: 'Configurações', items: [
      { path: '/planos', icon: <ClipboardList size={18} />, label: 'Planos' },
      { path: '/pagamentos', icon: <CreditCard size={18} />, label: 'Forma de Pagamento' },
      { path: '/configuracoes', icon: <Settings size={18} />, label: 'Configurações' },
      { path: '/perfil', icon: <User size={18} />, label: 'Perfil' },
    ]}
  ]
  
  // Menu para Revendedor
  const revendedorMenu = [
    { section: 'Principal', items: [
      { path: '/gerar-pix', icon: <CreditCard size={18} />, label: 'Gerar PIX' },
      { path: '/vendas', icon: <ShoppingCart size={18} />, label: 'Minhas Vendas' },
      { path: '/verificar-venda', icon: <BarChart3 size={18} />, label: 'Verificar Venda' },
      { path: '/logs-pix', icon: <ClipboardList size={18} />, label: 'Logs de Códigos' },
      { path: '/pagar-contas', icon: <Wallet size={18} />, label: '💳 Pagar Contas' },
    ]},
    { section: 'Conta', items: [
      { path: '/meu-plano', icon: <Wallet size={18} />, label: 'Meu Plano' },
      { path: '/configuracoes', icon: <Settings size={18} />, label: 'Configurações' },
      { path: '/perfil', icon: <User size={18} />, label: 'Perfil' },
    ]}
  ]
  
  const menu = isAdmin() ? adminMenu : revendedorMenu
  
  return (
    <>
      {/* Overlay para mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">👑</div>
            <div className="sidebar-logo-text">
              <h2>Painel Master</h2>
              <span>{isAdmin() ? 'Administrador' : 'Revendedor'}</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menu.map((group, groupIndex) => (
            <div className="nav-section" key={groupIndex}>
              <div className="nav-section-title">{group.section}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.nome?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.nome || 'Usuário'}</div>
              <div className="user-role">
                {isAdmin() ? 'Administrador' : 'Revendedor'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
