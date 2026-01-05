import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageWrapper } from '../components/Layout'
import { Card, Button } from '../components/UI'
import { getConfiguracoes, updateConfiguracao, supabaseRequest } from '../services/supabase'
import toast from 'react-hot-toast'

export function Perfil() {
  const { user, isAdmin, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  })
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.senhaAtual || !form.novaSenha || !form.confirmarSenha) {
      toast.error('Preencha todos os campos')
      return
    }
    
    if (form.novaSenha !== form.confirmarSenha) {
      toast.error('As senhas não conferem!')
      return
    }
    
    if (form.novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    
    setLoading(true)
    
    try {
      if (isAdmin()) {
        // Admin: verificar senha atual nas configurações
        const configs = await getConfiguracoes()
        
        if (configs.admin_senha !== form.senhaAtual) {
          toast.error('Senha atual incorreta!')
          setLoading(false)
          return
        }
        
        await updateConfiguracao('admin_senha', form.novaSenha)
      } else {
        // Revendedor: verificar senha atual e atualizar
        const associadoData = await supabaseRequest(
          `master_associados?id=eq.${user.id}&select=senha`
        )
        
        if (!associadoData || !associadoData[0] || associadoData[0].senha !== form.senhaAtual) {
          toast.error('Senha atual incorreta!')
          setLoading(false)
          return
        }
        
        await supabaseRequest(
          `master_associados?id=eq.${user.id}`,
          'PATCH',
          { 
            senha: form.novaSenha,
            primeiro_acesso: false 
          }
        )
      }
      
      toast.success('Senha alterada com sucesso!')
      setForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error('Erro ao alterar senha')
    }
    
    setLoading(false)
  }
  
  return (
    <PageWrapper title="Perfil" subtitle="Gerenciar informações da conta">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '24px', 
        marginBottom: '32px' 
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, var(--accent), var(--purple))',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: '700',
          color: '#fff'
        }}>
          {user?.nome?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
            {user?.nome || 'Usuário'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {isAdmin() ? 'Administrador' : 'Revendedor'} • @{user?.username}
          </p>
        </div>
      </div>
      
      <Card title="Alterar Senha">
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ maxWidth: '400px' }}>
            <label>Senha Atual</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Digite sua senha atual"
              value={form.senhaAtual}
              onChange={(e) => setForm(prev => ({ ...prev, senhaAtual: e.target.value }))}
            />
          </div>
          
          <div className="form-group" style={{ maxWidth: '400px' }}>
            <label>Nova Senha</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Digite a nova senha (mín. 6 caracteres)"
              value={form.novaSenha}
              onChange={(e) => setForm(prev => ({ ...prev, novaSenha: e.target.value }))}
            />
          </div>
          
          <div className="form-group" style={{ maxWidth: '400px' }}>
            <label>Confirmar Nova Senha</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Confirme a nova senha"
              value={form.confirmarSenha}
              onChange={(e) => setForm(prev => ({ ...prev, confirmarSenha: e.target.value }))}
            />
          </div>
          
          <Button type="submit" variant="primary" disabled={loading}>
            🔐 {loading ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </form>
      </Card>
    </PageWrapper>
  )
}
