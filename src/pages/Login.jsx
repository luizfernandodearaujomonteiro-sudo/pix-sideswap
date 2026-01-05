import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import './Login.css'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const result = await login(username, password)
    
    setLoading(false)
    
    if (result.success) {
      toast.success(`Bem-vindo, ${result.user.nome}!`)
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
  }
  
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-icon">👑</div>
          <h1>Painel Master</h1>
          <p>Gestão de Associados</p>
        </div>
        
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuário</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>Senha</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
