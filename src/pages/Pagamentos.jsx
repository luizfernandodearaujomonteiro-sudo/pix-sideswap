import { useState, useEffect } from 'react'
import { PageWrapper } from '../components/Layout'
import { Card, Button } from '../components/UI'
import { getConfiguracoes, updateConfiguracao } from '../services/supabase'
import toast from 'react-hot-toast'

export function Pagamentos() {
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    tipoChave: 'cpf',
    chavePix: '',
    beneficiario: '',
    carteiraLiquid: ''
  })
  
  useEffect(() => {
    loadConfigs()
  }, [])
  
  const loadConfigs = async () => {
    setLoading(true)
    
    try {
      const configs = await getConfiguracoes()
      setForm({
        tipoChave: configs.pix_tipo_chave || 'cpf',
        chavePix: configs.pix_chave || '',
        beneficiario: configs.pix_beneficiario || '',
        carteiraLiquid: configs.carteira_liquid || ''
      })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
    
    setLoading(false)
  }
  
  const handleSubmit = async (e) => {
  if (e) e.preventDefault()
  setLoading(true)
  
  try {
    await Promise.all([
      updateConfiguracao('pix_tipo_chave', form.tipoChave),
      updateConfiguracao('pix_chave', form.chavePix),
      updateConfiguracao('pix_beneficiario', form.beneficiario),
      updateConfiguracao('carteira_liquid', form.carteiraLiquid)
    ])
    
    toast.success('Configurações salvas com sucesso!')
  } catch (error) {
    console.error('Erro ao salvar:', error)
    toast.error('Erro ao salvar configurações')
  }
  
  setLoading(false)
}

const handleSalvarCarteira = async () => {
  setLoading(true)
  
  try {
    await updateConfiguracao('carteira_liquid', form.carteiraLiquid)
    toast.success('Carteira Liquid salva com sucesso!')
  } catch (error) {
    console.error('Erro ao salvar carteira:', error)
    toast.error('Erro ao salvar carteira')
  }
  
  setLoading(false)
}
  
  return (
    <PageWrapper title="Forma de Pagamento" subtitle="Configurar dados PIX e Carteira">
      <Card title="Configurações de Pagamento PIX">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Tipo de Chave PIX</label>
              <select 
                className="form-select"
                value={form.tipoChave}
                onChange={(e) => setForm(prev => ({ ...prev, tipoChave: e.target.value }))}
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave Aleatória</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Chave PIX</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Digite sua chave PIX"
                value={form.chavePix}
                onChange={(e) => setForm(prev => ({ ...prev, chavePix: e.target.value }))}
              />
            </div>
            
            <div className="form-group full">
              <label>Nome do Beneficiário</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Nome que aparecerá no PIX"
                value={form.beneficiario}
                onChange={(e) => setForm(prev => ({ ...prev, beneficiario: e.target.value }))}
              />
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <Button type="submit" variant="primary" disabled={loading}>
              💾 {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </Card>
      
      {/* CARTEIRA LIQUID - Para receber pagamentos de contas */}
      <Card title="💳 Carteira Liquid" style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
            ⚠️ <strong>Importante:</strong> Esta é a carteira que será exibida para os revendedores 
            quando eles forem pagar suas contas através da funcionalidade "Pagar Minhas Contas".
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            O revendedor irá transferir o valor (com taxa de 3%) para esta carteira.
          </p>
        </div>
        
        <div className="form-group">
          <label>Endereço da Carteira Liquid</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Cole aqui o endereço da sua carteira Liquid"
            value={form.carteiraLiquid}
            onChange={(e) => setForm(prev => ({ ...prev, carteiraLiquid: e.target.value }))}
          />
        </div>
        
        <Button variant="primary" onClick={handleSalvarCarteira} disabled={loading}>
          💾 {loading ? 'Salvando...' : 'Salvar Carteira'}
        </Button>
      </Card>
    </PageWrapper>
  )
}
