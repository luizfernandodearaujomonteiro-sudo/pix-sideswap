import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import './Header.css'

export function Header({ title, subtitle, onMenuClick }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <header className="header">
      <button className="mobile-menu-btn" onClick={onMenuClick}>
        <Menu size={20} />
      </button>
      
      <div className="header-title">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>
      
      <div className="header-actions">
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          <LogOut size={16} />
          <span className="btn-text-desktop">Sair</span>
        </button>
      </div>
    </header>
  )
}
