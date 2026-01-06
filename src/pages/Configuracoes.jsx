import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageWrapper } from '../components/Layout'
import { Card, Button } from '../components/UI'
import { getConfiguracoes, updateConfiguracao, supabaseRequest } from '../services/supabase'
import { CONFIG } from '../config/constants'
import toast from 'react-hot-toast'

export function Configuracoes() {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [webhookNotificacao, setWebhookNotificacao] = useState('')
  
  useEffect(() => {
    loadConfigs()
  }, [])
  
  const loadConfigs = async () => {
    setLoading(true)
    
    try {
      if (isAdmin()) {
        const configs = await getConfiguracoes()
        setApiKey(configs.api_key || '')
        setWebhookNotificacao(configs.webhook_notificacao || '')
      } else {
        // Revendedor: buscar API key do próprio registro
        const associadoData = await supabaseRequest(
          `master_associados?id=eq.${user.id}&select=api_key`
        )
        if (associadoData && associadoData[0]) {
          setApiKey(associadoData[0].api_key || '')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
    
    setLoading(false)
  }
  
  const handleSave = async () => {
    setLoading(true)
    
    try {
      if (isAdmin()) {
        await updateConfiguracao('api_key', apiKey)
        await updateConfiguracao('webhook_notificacao', webhookNotificacao)
      } else {
        // Revendedor: salvar API key no próprio registro
        await supabaseRequest(
          `master_associados?id=eq.${user.id}`,
          'PATCH',
          { api_key: apiKey }
        )
      }
      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configurações')
    }
    
    setLoading(false)
  }
  
  return (
    <PageWrapper title="Configurações" subtitle="Configurações da API">
      <Card title="Configurações da API">
        <div className="config-section">
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Chave API
            <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
          </div>
          
          <div className="form-group">
            <label>Sua Chave API da Plataforma</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Cole sua chave API aqui"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>
        
        {isAdmin() && (
          <div className="config-section" style={{ marginTop: '32px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔔 Notificações
              <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
            </div>
            
            <div className="form-group">
              <label>Webhook de Notificação</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="https://seu-webhook.com/notificacao"
                value={webhookNotificacao}
                onChange={(e) => setWebhookNotificacao(e.target.value)}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                Receba notificações quando revendedores criarem solicitações de pagamento de contas.
              </small>
            </div>
          </div>
        )}
        
        <div className="config-section" style={{ marginTop: '32px' }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Webhooks (Fixos)
            <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
          </div>
          
          <div className="form-group">
            <label>Webhook Gerar PIX</label>
            <input 
              type="text" 
              className="form-input" 
              value={CONFIG.WEBHOOKS.gerarPix}
              readOnly
            />
          </div>
          
          <div className="form-group">
            <label>Webhook Verificar Pagamento</label>
            <input 
              type="text" 
              className="form-input" 
              value={CONFIG.WEBHOOKS.verificarPagamento}
              readOnly
            />
          </div>
          
          <div className="form-group">
            <label>Webhook Verificar Transação</label>
            <input 
              type="text" 
              className="form-input" 
              value={CONFIG.WEBHOOKS.verificarTransacao}
              readOnly
            />
          </div>
        </div>
        
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          💾 {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </Card>
    </PageWrapper>
  )
}
