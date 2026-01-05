import { useState, useEffect } from 'react'
import { PageWrapper } from '../components/Layout'
import { Card, Button, Badge, DataTable, EmptyState, Loading, Modal, StatCard } from '../components/UI'
import { supabaseRequest } from '../services/supabase'
import { formatMoney, formatDateTime } from '../utils/helpers'
import toast from 'react-hot-toast'
import './SolicitacoesPagamento.css'

export function SolicitacoesPagamento() {
  const [loading, setLoading] = useState(true)
  const [solicitacoes, setSolicitacoes] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modalDetalhes, setModalDetalhes] = useState(null)
  const [modalProcessar, setModalProcessar] = useState(null)
  const [processando, setProcessando] = useState(false)
  
  const [formProcessar, setFormProcessar] = useState({
    observacoes: '',
    comprovante: null,
    comprovanteBase64: '',
    comprovanteNome: ''
  })
  
  useEffect(() => {
    loadSolicitacoes()
  }, [])
  
  const loadSolicitacoes = async () => {
    setLoading(true)
    
    try {
      const data = await supabaseRequest(
        'solicitacoes_pagamento?order=created_at.desc'
      )
      setSolicitacoes(data || [])
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
      toast.error('Erro ao carregar solicitações')
    }
    
    setLoading(false)
  }
  
  const getStatusBadge = (status) => {
    const statusMap = {
      'pendente': { type: 'warning', text: 'Pendente' },
      'em_processamento': { type: 'info', text: 'Em Processamento' },
      'pago': { type: 'success', text: 'Concluído' },
      'cancelado': { type: 'danger', text: 'Cancelado' }
    }
    return statusMap[status] || { type: 'default', text: status }
  }
  
  // Filtrar por status
  const solicitacoesFiltradas = solicitacoes.filter(s => {
    if (filtroStatus === 'todos') return true
    return s.status === filtroStatus
  })
  
  // Stats
  const stats = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter(s => s.status === 'pendente').length,
    emProcessamento: solicitacoes.filter(s => s.status === 'em_processamento').length,
    pagas: solicitacoes.filter(s => s.status === 'pago').length,
    valorPendente: solicitacoes
      .filter(s => s.status === 'pendente' || s.status === 'em_processamento')
      .reduce((sum, s) => sum + (s.valor_original || 0), 0)
  }
  
  const handleVerDetalhes = (solicitacao) => {
    setModalDetalhes(solicitacao)
  }
  
  const handleProcessar = (solicitacao) => {
    setModalProcessar(solicitacao)
    setFormProcessar({
      observacoes: solicitacao.observacoes_admin || '',
      comprovante: null,
      comprovanteBase64: '',
      comprovanteNome: ''
    })
  }
  
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande! Máximo 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormProcessar(prev => ({
          ...prev,
          comprovante: file,
          comprovanteBase64: event.target.result,
          comprovanteNome: file.name
        }))
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleAtualizarStatus = async (novoStatus) => {
    if (!modalProcessar) return
    
    // Validar se precisa de comprovante
    if (novoStatus === 'pago' && !formProcessar.comprovanteBase64) {
      toast.error('Anexe o comprovante de pagamento!')
      return
    }
    
    setProcessando(true)
    
    try {
      const payload = {
        status: novoStatus,
        observacoes_admin: formProcessar.observacoes || null,
        updated_at: new Date().toISOString()
      }
      
      if (novoStatus === 'pago') {
        payload.comprovante_base64 = formProcessar.comprovanteBase64
        payload.comprovante_nome = formProcessar.comprovanteNome
      }
      
      const result = await supabaseRequest(
        `solicitacoes_pagamento?id=eq.${modalProcessar.id}`,
        'PATCH',
        payload
      )
      
      if (result !== null) {
        toast.success(`Status atualizado para: ${getStatusBadge(novoStatus).text}`)
        setModalProcessar(null)
        loadSolicitacoes()
      } else {
        toast.error('Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao atualizar')
    }
    
    setProcessando(false)
  }
  
  return (
    <PageWrapper title="Solicitações de Pagamento" subtitle="Gerenciar pagamentos de contas dos revendedores">
      {/* STATS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard 
          icon="📋" 
          value={stats.pendentes} 
          label="Pendentes" 
          color="yellow" 
        />
        <StatCard 
          icon="⏳" 
          value={stats.emProcessamento} 
          label="Em Processamento" 
          color="blue" 
        />
        <StatCard 
          icon="✅" 
          value={stats.pagas} 
          label="Concluídas" 
          color="green" 
        />
        <StatCard 
          icon="💰" 
          value={formatMoney(stats.valorPendente)} 
          label="Valor Pendente" 
          color="purple" 
        />
      </div>
      
      {/* LISTA */}
      <Card 
        title="Solicitações"
        actions={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '8px 32px 8px 12px' }}
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todos">📋 Todos ({stats.total})</option>
              <option value="pendente">⏳ Pendentes ({stats.pendentes})</option>
              <option value="em_processamento">🔄 Em Processamento ({stats.emProcessamento})</option>
              <option value="pago">✅ Concluídos ({stats.pagas})</option>
              <option value="cancelado">❌ Cancelados</option>
            </select>
            <Button variant="secondary" size="sm" onClick={loadSolicitacoes} disabled={loading}>
              🔄 Atualizar
            </Button>
          </div>
        }
      >
        {loading ? (
          <Loading message="Carregando solicitações..." />
        ) : (
          <DataTable
            columns={[
              { header: 'ID', render: (row) => `#${row.id}` },
              { header: 'Revendedor', accessor: 'nome_solicitante' },
              { header: 'Valor Conta', render: (row) => formatMoney(row.valor_original) },
              { header: 'Valor Recebido', render: (row) => formatMoney(row.valor_com_taxa) },
              { header: 'Data', render: (row) => formatDateTime(row.created_at) },
              { 
                header: 'Status', 
                render: (row) => {
                  const status = getStatusBadge(row.status)
                  return <Badge type={status.type}>{status.text}</Badge>
                }
              },
              {
                header: 'Ações',
                render: (row) => (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" size="sm" onClick={() => handleVerDetalhes(row)}>
                      👁️
                    </Button>
                    {row.status !== 'pago' && row.status !== 'cancelado' && (
                      <Button variant="primary" size="sm" onClick={() => handleProcessar(row)}>
                        ⚙️ Processar
                      </Button>
                    )}
                  </div>
                )
              }
            ]}
            data={solicitacoesFiltradas}
            emptyState={
              <EmptyState
                icon="📋"
                title="Nenhuma solicitação"
                description="Não há solicitações de pagamento no momento."
              />
            }
          />
        )}
      </Card>
      
      {/* MODAL DETALHES */}
      <Modal
        isOpen={!!modalDetalhes}
        onClose={() => setModalDetalhes(null)}
        title={`Solicitação #${modalDetalhes?.id}`}
        size="lg"
      >
        {modalDetalhes && (
          <div className="detalhes-admin">
            <div className="detalhe-header-admin">
              <div>
                <span className="revendedor-nome">{modalDetalhes.nome_solicitante}</span>
              </div>
              <Badge type={getStatusBadge(modalDetalhes.status).type}>
                {getStatusBadge(modalDetalhes.status).text}
              </Badge>
            </div>
            
            <div className="valores-grid">
              <div className="valor-box">
                <label>Valor da Conta</label>
                <span className="valor-grande">{formatMoney(modalDetalhes.valor_original)}</span>
              </div>
              <div className="valor-box taxa">
                <label>Taxa (3%)</label>
                <span>{formatMoney(modalDetalhes.valor_com_taxa - modalDetalhes.valor_original)}</span>
              </div>
              <div className="valor-box recebido">
                <label>Valor Recebido</label>
                <span className="valor-destaque">{formatMoney(modalDetalhes.valor_com_taxa)}</span>
              </div>
            </div>
            
            <div className="info-box">
              <label>TX ID do Revendedor:</label>
              <code>{modalDetalhes.transaction_id_revendedor}</code>
            </div>
            
            {modalDetalhes.codigo_barras && (
              <div className="info-box codigo-barras-box">
                <label>📄 Código de Barras para Pagamento:</label>
                <code className="codigo-barras-codigo">{modalDetalhes.codigo_barras}</code>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    navigator.clipboard.writeText(modalDetalhes.codigo_barras)
                    toast.success('Código copiado!')
                  }}
                  style={{ marginTop: '8px' }}
                >
                  📋 Copiar Código
                </Button>
              </div>
            )}
            
            {modalDetalhes.fatura_base64 && (
              <div className="info-box fatura-box">
                <label>📎 Fatura/Boleto Anexado:</label>
                <a 
                  href={modalDetalhes.fatura_base64} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-download"
                  download={modalDetalhes.fatura_nome}
                >
                  📥 Baixar {modalDetalhes.fatura_nome}
                </a>
              </div>
            )}
            
            {modalDetalhes.observacoes_revendedor && (
              <div className="info-box" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid var(--purple)' }}>
                <label>📝 Observações do Revendedor:</label>
                <span style={{ display: 'block', marginTop: '8px' }}>{modalDetalhes.observacoes_revendedor}</span>
              </div>
            )}
            
            <div className="info-box">
              <label>Criado em:</label>
              <span>{formatDateTime(modalDetalhes.created_at)}</span>
            </div>
            
            {modalDetalhes.observacoes_admin && (
              <div className="info-box obs-box">
                <label>Observações:</label>
                <span>{modalDetalhes.observacoes_admin}</span>
              </div>
            )}
            
            {modalDetalhes.comprovante_base64 && (
              <div className="info-box comprovante-anexado">
                <label>✅ Comprovante de Pagamento:</label>
                <a 
                  href={modalDetalhes.comprovante_base64} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-download success"
                >
                  📄 Ver Comprovante
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* MODAL PROCESSAR */}
      <Modal
        isOpen={!!modalProcessar}
        onClose={() => setModalProcessar(null)}
        title={`Processar Solicitação #${modalProcessar?.id}`}
        size="lg"
      >
        {modalProcessar && (
          <div className="processar-solicitacao">
            <div className="resumo-solicitacao">
              <div className="resumo-header">
                <span>📋 Resumo</span>
                <Badge type={getStatusBadge(modalProcessar.status).type}>
                  {getStatusBadge(modalProcessar.status).text}
                </Badge>
              </div>
              <div className="resumo-content">
                <div className="resumo-row">
                  <span>Revendedor:</span>
                  <strong>{modalProcessar.nome_solicitante}</strong>
                </div>
                <div className="resumo-row">
                  <span>Valor da Conta:</span>
                  <strong>{formatMoney(modalProcessar.valor_original)}</strong>
                </div>
                <div className="resumo-row destaque">
                  <span>Valor Recebido:</span>
                  <strong className="valor-destaque">{formatMoney(modalProcessar.valor_com_taxa)}</strong>
                </div>
              </div>
            </div>
            
            {/* Dados para Pagamento */}
            <div className="dados-pagamento">
              <h4>💳 Dados para Pagamento</h4>
              
              {modalProcessar.codigo_barras && (
                <div className="dado-item">
                  <label>Código de Barras:</label>
                  <div className="codigo-com-botao">
                    <code>{modalProcessar.codigo_barras}</code>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(modalProcessar.codigo_barras)
                        toast.success('Código copiado!')
                      }}
                    >
                      📋 Copiar
                    </Button>
                  </div>
                </div>
              )}
              
              {modalProcessar.fatura_base64 && (
                <div className="dado-item">
                  <label>Fatura Anexada:</label>
                  <a 
                    href={modalProcessar.fatura_base64} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-download"
                    download={modalProcessar.fatura_nome}
                  >
                    📥 Baixar Fatura ({modalProcessar.fatura_nome})
                  </a>
                </div>
              )}
              
              {modalProcessar.observacoes_revendedor && (
                <div className="dado-item" style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--purple)' }}>
                  <label style={{ color: 'var(--purple)' }}>📝 Observações do Revendedor:</label>
                  <span style={{ display: 'block', marginTop: '8px' }}>{modalProcessar.observacoes_revendedor}</span>
                </div>
              )}
            </div>
            
            {/* Form de Processamento */}
            <div className="form-processamento">
              <div className="form-group">
                <label>Observações (opcional)</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Adicione observações sobre este pagamento..."
                  value={formProcessar.observacoes}
                  onChange={(e) => setFormProcessar(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Comprovante de Pagamento</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    id="comprovanteInput"
                  />
                  <label htmlFor="comprovanteInput" className="file-upload-label">
                    📎 {formProcessar.comprovanteNome || 'Clique para anexar comprovante'}
                  </label>
                </div>
                {formProcessar.comprovanteNome && (
                  <p className="file-selected">✅ {formProcessar.comprovanteNome}</p>
                )}
              </div>
            </div>
            
            {/* Ações */}
            <div className="acoes-processamento">
              {modalProcessar.status === 'pendente' && (
                <Button 
                  variant="info" 
                  onClick={() => handleAtualizarStatus('em_processamento')}
                  disabled={processando}
                >
                  🔄 Marcar Em Processamento
                </Button>
              )}
              
              <Button 
                variant="success" 
                onClick={() => handleAtualizarStatus('pago')}
                disabled={processando}
              >
                ✅ Marcar como Pago
              </Button>
              
              <Button 
                variant="danger" 
                onClick={() => handleAtualizarStatus('cancelado')}
                disabled={processando}
              >
                ❌ Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  )
}
