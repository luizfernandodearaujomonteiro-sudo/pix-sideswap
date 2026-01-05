import { createContext, useContext, useState, useEffect } from 'react'
import { getConfiguracoes, getAssociadoByCredentials } from '../services/supabase'
import { ROLES } from '../config/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verificar sessão salva ao carregar
  useEffect(() => {
    const savedUser = localStorage.getItem('painelMasterUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  // Login - verifica se é admin ou revendedor
  const login = async (username, password) => {
    try {
      // Primeiro, verificar se é admin
      const configs = await getConfiguracoes()
      
      if (configs.admin_usuario === username && configs.admin_senha === password) {
        const adminUser = {
          id: 'admin',
          username: username,
          nome: configs.admin_nome || 'Administrador',
          role: ROLES.ADMIN
        }
        setUser(adminUser)
        localStorage.setItem('painelMasterUser', JSON.stringify(adminUser))
        return { success: true, user: adminUser }
      }
      
      // Se não for admin, verificar se é revendedor (associado)
      const associado = await getAssociadoByCredentials(username, password)
      
      if (associado) {
        const revendedorUser = {
          id: associado.id,
          username: associado.usuario,
          nome: associado.nome,
          role: ROLES.REVENDEDOR,
          planoId: associado.plano_id,
          dataVencimento: associado.data_vencimento,
          primeiroAcesso: associado.primeiro_acesso
        }
        setUser(revendedorUser)
        localStorage.setItem('painelMasterUser', JSON.stringify(revendedorUser))
        return { success: true, user: revendedorUser }
      }
      
      return { success: false, error: 'Usuário ou senha inválidos' }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Erro ao realizar login' }
    }
  }

  // Logout
  const logout = () => {
    setUser(null)
    localStorage.removeItem('painelMasterUser')
  }

  // Verificar se é admin
  const isAdmin = () => user?.role === ROLES.ADMIN

  // Verificar se é revendedor
  const isRevendedor = () => user?.role === ROLES.REVENDEDOR

  // Atualizar dados do usuário
  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData }
    setUser(updatedUser)
    localStorage.setItem('painelMasterUser', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isRevendedor,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
