import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageWrapper } from '../components/Layout'
import { Card, Button, CopyBox } from '../components/UI'
import { gerarPix } from '../services/api'
import { supabaseRequest, getApiKey } from '../services/supabase'
import { formatMoney, copyToClipboard } from '../utils/helpers'
import toast from 'react-hot-toast'
import './GerarPix.css'

export function GerarPix() {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    valor: ''
  })
  const [resultado, setResultado] = useState(null)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.nome || !form.valor) {
      toast.error('Preencha nome e valor')
      return
    }
    
    setLoading(true)
    setResultado(null)
    
    try {
      // Buscar API key correta (admin ou revendedor)
      const apiKey = await getApiKey(user, isAdmin())
      
      if (!apiKey) {
        toast.error('API Key não configurada! Vá em Configurações para adicionar.')
        setLoading(false)
        return
      }
      
      const result = await gerarPix(form.nome, form.valor, apiKey)
      
      if (result.success) {
        setResultado(result)
        
        // Salvar log no Supabase
        if (isAdmin()) {
          // Admin salva em logs_pix geral
          await supabaseRequest('logs_pix', 'POST', {
            id_transacao: result.pixId?.toString(),
            cliente: form.nome,
            gerado_por: user.username,
            nome_gerador: user.nome,
            valor: parseFloat(form.valor),
            transaction_id: result.transactionId
          })
        } else {
          // Revendedor salva em associado_logs_pix com seu ID
          await supabaseRequest('associado_logs_pix', 'POST', {
            associado_id: user.id,
            id_transacao: result.pixId?.toString(),
            cliente: form.nome,
            valor: parseFloat(form.valor),
            transaction_id: result.transactionId,
            status: 'pending'
          })
        }
        
        toast.success('PIX gerado com sucesso!')
      } else {
        toast.error('Erro ao gerar PIX')
      }
    } catch (error) {
      console.error('Erro ao gerar PIX:', error)
      toast.error('Erro ao gerar PIX')
    }
    
    setLoading(false)
  }
  
  const handleCopyCopiaCola = async () => {
    if (resultado?.copiaCola) {
      await copyToClipboard(resultado.copiaCola)
      toast.success('Código PIX copiado!')
    }
  }
  
  const handleNovo = () => {
    setResultado(null)
    setForm({ nome: '', valor: '' })
  }
  
  return (
    <PageWrapper title="Gerar PIX" subtitle="Criar QR Code de pagamento">
      <Card title="Gerar QR Code PIX">
        {!resultado ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome do Cliente</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Nome de quem vai pagar"
                value={form.nome}
                onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            
            <div className="form-group">
              <label>Valor (R$)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="0,00"
                step="0.01"
                min="0.01"
                value={form.valor}
                onChange={(e) => setForm(prev => ({ ...prev, valor: e.target.value }))}
              />
            </div>
            
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? '⏳ Gerando...' : '💸 Gerar QR Code PIX'}
            </Button>
          </form>
        ) : (
          <div className="pix-resultado">
            <div className="pix-qrcode-container">
              <img 
                src={resultado.qrCode} 
                alt="QR Code PIX" 
                className="pix-qrcode"
              />
            </div>
            
            <div className="pix-info">
              <div className="pix-info-item">
                <span className="pix-info-label">ID da Transação</span>
                <span className="pix-info-value">#{resultado.pixId}</span>
              </div>
              
              <div className="pix-info-item">
                <span className="pix-info-label">Cliente</span>
                <span className="pix-info-value">{form.nome}</span>
              </div>
              
              <div className="pix-info-item">
                <span className="pix-info-label">Valor</span>
                <span className="pix-info-value pix-valor">{formatMoney(form.valor)}</span>
              </div>
              
              {resultado.transactionId && (
                <div className="pix-info-item">
                  <span className="pix-info-label">Transaction ID</span>
                  <span className="pix-info-value pix-hash">{resultado.transactionId}</span>
                </div>
              )}
            </div>
            
            <div className="pix-copia-cola">
              <div className="pix-copia-cola-header">
                <span>PIX Copia e Cola</span>
                <Button variant="primary" size="sm" onClick={handleCopyCopiaCola}>
                  📋 Copiar
                </Button>
              </div>
              <div className="pix-copia-cola-content">
                {resultado.copiaCola}
              </div>
            </div>
            
            <div className="pix-actions">
              <Button variant="secondary" onClick={handleNovo}>
                ➕ Gerar Novo PIX
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageWrapper>
  )
}
