import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import './Layout.css'

export function Layout({ title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="dashboard">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        <Header 
          title={title} 
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// HOC para envolver páginas com título dinâmico
export function PageWrapper({ title, subtitle, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="dashboard">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        <Header 
          title={title} 
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  )
}
