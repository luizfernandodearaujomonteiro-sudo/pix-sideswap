import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageWrapper } from '../components/Layout'
import { Card, Badge, Button } from '../components/UI'
import { verificarTransacao, traduzirStatus } from '../services/api'
import { getApiKey } from '../services/supabase'
import { formatMoney } from '../utils/helpers'
import toast from 'react-hot-toast'

export function VerificarVenda() {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [idTransacao, setIdTransacao] = useState('')
  const [resultado, setResultado] = useState(null)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!idTransacao) {
      toast.error('Digite o ID da transação')
      return
    }
    
    setLoading(true)
    setResultado(null)
    
    try {
      // Buscar API key correta (admin ou revendedor)
      const apiKey = await getApiKey(user, isAdmin())
      
      const result = await verificarTransacao(idTransacao, apiKey)
      
      if (result.success) {
        setResultado(result)
        toast.success('Transação encontrada!')
      } else {
        toast.error('Transação não encontrada')
      }
    } catch (error) {
      console.error('Erro ao verificar:', error)
      toast.error('Erro ao verificar transação')
    }
    
    setLoading(false)
  }
  
  const status = resultado ? traduzirStatus(resultado.status) : null
  
  return (
    <PageWrapper title="Verificar Venda" subtitle="Buscar transação pelo ID">
      <Card title="Verificar Venda pelo ID">
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ maxWidth: '400px' }}>
            <label>ID da Transação</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Digite o ID (ex: 5351)"
              value={idTransacao}
              onChange={(e) => setIdTransacao(e.target.value)}
            />
          </div>
          
          <Button type="submit" variant="primary" disabled={loading}>
            🔍 {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </form>
        
        {resultado && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />
            
            <div style={{
              background: 'var(--bg-elevated)',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '400px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>ID</span>
                <span style={{ fontWeight: '600' }}>#{resultado.id}</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Cliente</span>
                <span style={{ fontWeight: '600' }}>{resultado.cliente}</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Valor</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)', fontSize: '18px' }}>
                  {formatMoney(resultado.valor)}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0'
              }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Status</span>
                <Badge type={status?.type || 'default'}>{status?.text || '-'}</Badge>
              </div>
            </div>
          </>
        )}
      </Card>
    </PageWrapper>
  )
}
