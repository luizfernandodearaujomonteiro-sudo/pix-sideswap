import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageWrapper } from '../components/Layout'
import { Card, Button, Modal, Badge } from '../components/UI'
import { getPlanos, getAssociadoByCredentials, supabaseRequest } from '../services/supabase'
import { gerarPix } from '../services/api'
import { formatMoney, formatDate, getStatusVencimento, copyToClipboard } from '../utils/helpers'
import toast from 'react-hot-toast'
import './MeuPlano.css'

export function MeuPlano() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [plano, setPlano] = useState(null)
  const [associado, setAssociado] = useState(null)
  const [modalRenovar, setModalRenovar] = useState(false)
  const [renovacaoResult, setRenovacaoResult] = useState(null)
  const [pixCopiaCola, setPixCopiaCola] = useState('')
  
  useEffect(() => {
    loadPlano()
  }, [])
  
  const loadPlano = async () => {
    setLoading(true)
    
    try {
      // Buscar dados atualizados do associado
      const associadoData = await supabaseRequest(
        `master_associados?id=eq.${user.id}&select=*`
      )
      
      if (associadoData && associadoData[0]) {
        setAssociado(associadoData[0])
        
        // Buscar dados do plano
        const planos = await getPlanos()
        const planoAtual = planos.find(p => p.id === associadoData[0].plano_id)
        setPlano(planoAtual)
      }
    } catch (error) {
      console.error('Erro ao carregar plano:', error)
    }
    
    setLoading(false)
  }
  
  // Calcular dias restantes
  const calcularDiasRestantes = () => {
    if (!associado?.data_vencimento) return 0
    
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const vencimento = new Date(associado.data_vencimento + 'T00:00:00')
    const diff = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24))
    
    return diff
  }
  
  const diasRestantes = calcularDiasRestantes()
  const statusVencimento = associado ? getStatusVencimento(associado.data_vencimento) : null
  
  const handleRenovar = async () => {
    setLoading(true)
    setRenovacaoResult(null)
    
    try {
      // Gerar PIX para renovação
      const result = await gerarPix(
        `Renovação - ${associado?.nome || user.nome}`,
        plano?.valor || 0
      )
      
      if (result.success) {
        setRenovacaoResult(result)
        setPixCopiaCola(result.copiaCola)
        
        // Registrar renovação pendente
        await supabaseRequest('renovacoes_pendentes', 'POST', {
          associado_id: user.id,
          id_transacao: result.pixId,
          valor: plano?.valor || 0,
          status: 'pending'
        })
        
        toast.success('PIX gerado! Realize o pagamento.')
      } else {
        toast.error('Erro ao gerar PIX')
      }
    } catch (error) {
      console.error('Erro ao gerar renovação:', error)
      toast.error('Erro ao gerar PIX')
    }
    
    setLoading(false)
  }
  
  const handleCopiar = async () => {
    await copyToClipboard(pixCopiaCola)
    toast.success('Código PIX copiado!')
  }
  
  const closeModalRenovar = () => {
    setModalRenovar(false)
    setRenovacaoResult(null)
  }
  
  if (loading && !plano) {
    return (
      <PageWrapper title="Meu Plano" subtitle="Carregando...">
        <div className="loading-overlay" style={{ position: 'relative', minHeight: '300px' }}>
          <div className="spinner"></div>
        </div>
      </PageWrapper>
    )
  }
  
  return (
    <PageWrapper title="Meu Plano" subtitle="Detalhes da sua assinatura">
      <div className="plano-card">
        <div className="plano-card-icon">⭐</div>
        <div className="plano-card-nome">{plano?.nome || 'Plano'}</div>
        <div className="plano-card-valor">
          <span>{formatMoney(plano?.valor || 0)}</span>
          <span>/mês</span>
        </div>
        
        <div className="plano-card-info">
          <div className="plano-card-info-item">
            <div className="plano-card-info-label">Status</div>
            <div className={`plano-card-info-value ${statusVencimento?.type || ''}`}>
              {statusVencimento?.text || 'Ativo'}
            </div>
          </div>
          <div className="plano-card-info-item">
            <div className="plano-card-info-label">Vencimento</div>
            <div className="plano-card-info-value">
              {formatDate(associado?.data_vencimento)}
            </div>
          </div>
          <div className="plano-card-info-item">
            <div className="plano-card-info-label">Dias Restantes</div>
            <div className={`plano-card-info-value ${diasRestantes <= 5 ? 'danger' : diasRestantes <= 10 ? 'warning' : 'success'}`}>
              {diasRestantes > 0 ? diasRestantes : 'Vencido'}
            </div>
          </div>
        </div>
        
        <Button 
          variant="primary" 
          size="lg" 
          onClick={() => setModalRenovar(true)}
        >
          💳 Pagar Mensalidade
        </Button>
      </div>
      
      {/* Modal Renovar */}
      <Modal
        isOpen={modalRenovar}
        onClose={closeModalRenovar}
        title="💳 Pagar Mensalidade"
        size="lg"
      >
        {!renovacaoResult ? (
          <div>
            <div style={{
              background: 'var(--bg-elevated)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Plano</span>
                <span style={{ fontWeight: '600' }}>{plano?.nome}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Valor</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{formatMoney(plano?.valor)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Cliente</span>
                <span style={{ fontWeight: '600' }}>{associado?.nome || user.nome}</span>
              </div>
            </div>
            
            <Button variant="primary" fullWidth onClick={handleRenovar} disabled={loading}>
              💸 {loading ? 'Gerando...' : 'Gerar QR Code'}
            </Button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              display: 'inline-block',
              marginBottom: '20px'
            }}>
              <img 
                src={renovacaoResult.qrCode} 
                alt="QR Code PIX" 
                style={{ width: '200px', height: '200px' }}
              />
            </div>
            
            <div style={{
              background: 'var(--bg-elevated)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Valor</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{formatMoney(plano?.valor)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>ID</span>
                <span style={{ fontWeight: '600' }}>#{renovacaoResult.pixId}</span>
              </div>
            </div>
            
            <div style={{
              background: 'var(--bg-input)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              wordBreak: 'break-all',
              color: 'var(--text-secondary)',
              maxHeight: '80px',
              overflow: 'auto',
              textAlign: 'left'
            }}>
              {pixCopiaCola}
            </div>
            
            <Button variant="secondary" onClick={handleCopiar}>
              📋 Copiar Código PIX
            </Button>
            
            <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Após o pagamento, seu plano será renovado automaticamente.
            </p>
          </div>
        )}
      </Modal>
    </PageWrapper>
  )
}
