import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageWrapper } from '../components/Layout'
import { Card, Button, Badge, DataTable, EmptyState, Loading, Modal } from '../components/UI'
import { supabaseRequest, getConfiguracoes } from '../services/supabase'
import { formatMoney, formatDateTime, copyToClipboard, downloadBase64File } from '../utils/helpers'
import toast from 'react-hot-toast'
import './PagarContas.css'

export function PagarContas() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingHistorico, setLoadingHistorico] = useState(true)
  const [solicitacoes, setSolicitacoes] = useState([])
  const [carteiraLiquid, setCarteiraLiquid] = useState('')
  const [step, setStep] = useState(1) // 1: valor, 2: dados conta, 3: enviar pix, 4: confirmar
  const [modalDetalhes, setModalDetalhes] = useState(null)
  
  const [form, setForm] = useState({
    valorConta: '',
    valorComTaxa: 0,
    codigoBarras: '',
    fatura: null,
    faturaBase64: '',
    faturaNome: '',
    transactionId: '',
    observacoes: ''
  })
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setLoadingHistorico(true)
    
    try {
      // Buscar carteira Liquid do admin
      const configs = await getConfiguracoes()
      setCarteiraLiquid(configs.carteira_liquid || '')
      
      // Buscar histórico de solicitações
      const data = await supabaseRequest(
        `solicitacoes_pagamento?associado_id=eq.${user.id}&order=created_at.desc`
      )
      setSolicitacoes(data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
    
    setLoadingHistorico(false)
  }
  
  // Calcular valor com taxa de 3%
  const calcularValorComTaxa = (valor) => {
    const valorNum = parseFloat(valor) || 0
    return valorNum * 1.03
  }
  
  const handleValorChange = (e) => {
    const valor = e.target.value
    setForm(prev => ({
      ...prev,
      valorConta: valor,
      valorComTaxa: calcularValorComTaxa(valor)
    }))
  }
  
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Verificar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande! Máximo 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        setForm(prev => ({
          ...prev,
          fatura: file,
          faturaBase64: event.target.result,
          faturaNome: file.name
        }))
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleCopiarCarteira = async () => {
    await copyToClipboard(carteiraLiquid)
    toast.success('Carteira Liquid copiada!')
  }
  
  const handleProximoStep = () => {
    if (step === 1) {
      if (!form.valorConta || parseFloat(form.valorConta) <= 0) {
        toast.error('Informe um valor válido')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!form.codigoBarras && !form.faturaBase64) {
        toast.error('Informe o código de barras ou anexe a fatura')
        return
      }
      setStep(3)
    } else if (step === 3) {
      setStep(4)
    }
  }
  
  const handleVoltarStep = () => {
    if (step > 1) setStep(step - 1)
  }
  
  const handleEnviarSolicitacao = async () => {
    if (!form.transactionId) {
      toast.error('Informe o ID de Transação')
      return
    }
    
    setLoading(true)
    
    try {
      const payload = {
        associado_id: user.id,
        nome_solicitante: user.nome,
        valor_original: parseFloat(form.valorConta),
        valor_com_taxa: form.valorComTaxa,
        codigo_barras: form.codigoBarras || null,
        fatura_base64: form.faturaBase64 || null,
        fatura_nome: form.faturaNome || null,
        transaction_id_revendedor: form.transactionId,
        observacoes_revendedor: form.observacoes || null,
        status: 'pendente',
        observacoes_admin: null,
        comprovante_base64: null
      }
      
      const result = await supabaseRequest('solicitacoes_pagamento', 'POST', payload)
      
      if (result) {
        toast.success('Solicitação enviada com sucesso!')
        
        // Enviar notificação para webhook do admin
        try {
          const configs = await getConfiguracoes()
          const webhookUrl = configs.webhook_notificacao
          
          if (webhookUrl) {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tipo: 'nova_solicitacao_pagamento',
                solicitacao_id: result[0]?.id,
                revendedor: user.nome,
                valor_conta: parseFloat(form.valorConta),
                valor_com_taxa: form.valorComTaxa,
                codigo_barras: form.codigoBarras || null,
                observacoes: form.observacoes || null,
                data: new Date().toISOString()
              })
            })
          }
        } catch (webhookError) {
          console.log('Webhook não enviado:', webhookError)
        }
        
        // Resetar form
        setForm({
          valorConta: '',
          valorComTaxa: 0,
          codigoBarras: '',
          fatura: null,
          faturaBase64: '',
          faturaNome: '',
          transactionId: '',
          observacoes: ''
        })
        setStep(1)
        
        // Recarregar histórico
        loadData()
      } else {
        toast.error('Erro ao enviar solicitação')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao enviar solicitação')
    }
    
    setLoading(false)
  }
  
  const handleCancelar = () => {
    setForm({
      valorConta: '',
      valorComTaxa: 0,
      codigoBarras: '',
      fatura: null,
      faturaBase64: '',
      faturaNome: '',
      transactionId: '',
      observacoes: ''
    })
    setStep(1)
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
  
  const handleVerDetalhes = (solicitacao) => {
    setModalDetalhes(solicitacao)
  }
  
  return (
    <PageWrapper title="Pagar Minhas Contas" subtitle="Solicite pagamento de boletos e contas">
      {/* FORMULÁRIO DE NOVA SOLICITAÇÃO */}
      <Card title="Nova Solicitação de Pagamento">
        {/* STEP INDICATOR */}
        <div className="steps-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Valor</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Dados da Conta</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <span>Enviar PIX</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <span>Confirmar</span>
          </div>
        </div>
        
        {/* STEP 1: VALOR */}
        {step === 1 && (
          <div className="step-content">
            <h3>💰 Qual o valor da conta?</h3>
            <p className="step-description">Informe o valor exato da conta/boleto que deseja pagar.</p>
            
            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label>Valor da Conta (R$)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0,00"
                step="0.01"
                min="0.01"
                value={form.valorConta}
                onChange={handleValorChange}
              />
            </div>
            
            {form.valorConta && parseFloat(form.valorConta) > 0 && (
              <div className="valor-calculado">
                <div className="valor-item">
                  <span>Valor da Conta:</span>
                  <strong>{formatMoney(form.valorConta)}</strong>
                </div>
                <div className="valor-item">
                  <span>Taxa de Serviço (3%):</span>
                  <strong>{formatMoney(parseFloat(form.valorConta) * 0.03)}</strong>
                </div>
                <div className="valor-item total">
                  <span>Total a Enviar:</span>
                  <strong className="valor-destaque">{formatMoney(form.valorComTaxa)}</strong>
                </div>
              </div>
            )}
            
            <div className="step-actions">
              <Button variant="primary" onClick={handleProximoStep}>
                Próximo →
              </Button>
            </div>
          </div>
        )}
        
        {/* STEP 2: DADOS DA CONTA */}
        {step === 2 && (
          <div className="step-content">
            <h3>📄 Dados da Conta</h3>
            <p className="step-description">Informe o código de barras ou anexe a fatura/boleto.</p>
            
            <div className="form-group">
              <label>Código de Barras (opcional se anexar fatura)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Digite ou cole o código de barras"
                value={form.codigoBarras}
                onChange={(e) => setForm(prev => ({ ...prev, codigoBarras: e.target.value }))}
              />
            </div>
            
            <div className="divisor-ou">
              <span>ou</span>
            </div>
            
            <div className="form-group">
              <label>Anexar Fatura/Boleto (PDF ou Imagem)</label>
              <div className="file-upload">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  id="faturaInput"
                />
                <label htmlFor="faturaInput" className="file-upload-label">
                  📎 {form.faturaNome || 'Clique para selecionar arquivo'}
                </label>
              </div>
              {form.faturaNome && (
                <p className="file-selected">✅ Arquivo selecionado: {form.faturaNome}</p>
              )}
            </div>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Suas Observações (opcional)</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Ex: Nome do destinatário, informações adicionais..."
                value={form.observacoes}
                onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              />
              <small className="form-hint">
                Informe dados importantes como nome do destinatário do pagamento.
              </small>
            </div>
            
            <div className="step-actions">
              <Button variant="secondary" onClick={handleVoltarStep}>
                ← Voltar
              </Button>
              <Button variant="primary" onClick={handleProximoStep}>
                Próximo →
              </Button>
            </div>
          </div>
        )}
        
        {/* STEP 3: ENVIAR PIX */}
        {step === 3 && (
          <div className="step-content">
            <h3>💸 Envie para a Carteira Liquid</h3>
            
            <div className="alerta-importante">
              <div className="alerta-icon">⚠️</div>
              <div className="alerta-content">
                <strong>IMPORTANTE!</strong>
                <p>Você deve enviar exatamente <strong className="valor-destaque">{formatMoney(form.valorComTaxa)}</strong> para a carteira abaixo.</p>
                <p>Este valor já inclui a taxa de serviço de 3%.</p>
              </div>
            </div>
            
            <div className="carteira-box">
              <label>Carteira Liquid do Administrador:</label>
              <div className="carteira-valor">
                <code>{carteiraLiquid || 'Carteira não configurada'}</code>
                <Button variant="primary" size="sm" onClick={handleCopiarCarteira} disabled={!carteiraLiquid}>
                  📋 Copiar
                </Button>
              </div>
            </div>
            
            <div className="resumo-envio">
              <div className="resumo-item">
                <span>Valor da Conta:</span>
                <span>{formatMoney(form.valorConta)}</span>
              </div>
              <div className="resumo-item">
                <span>Taxa (3%):</span>
                <span>{formatMoney(parseFloat(form.valorConta) * 0.03)}</span>
              </div>
              <div className="resumo-item total">
                <span>Total a Enviar:</span>
                <span className="valor-destaque">{formatMoney(form.valorComTaxa)}</span>
              </div>
            </div>
            
            <div className="step-actions">
              <Button variant="secondary" onClick={handleVoltarStep}>
                ← Voltar
              </Button>
              <Button variant="primary" onClick={handleProximoStep}>
                Já enviei para a Carteira →
              </Button>
            </div>
          </div>
        )}
        
        {/* STEP 4: CONFIRMAR */}
        {step === 4 && (
          <div className="step-content">
            <h3>✅ Confirmar Solicitação</h3>
            <p className="step-description">Informe o ID da transação que você realizou.</p>
            
            <div className="form-group">
              <label>ID de Transação</label>
              <input
                type="text"
                className="form-input"
                placeholder="Cole aqui o ID da transação"
                value={form.transactionId}
                onChange={(e) => setForm(prev => ({ ...prev, transactionId: e.target.value }))}
              />
              <small className="form-hint">
                O ID de transação é encontrado no comprovante do envio realizado.
              </small>
            </div>
            
            <div className="resumo-final">
              <h4>📋 Resumo da Solicitação</h4>
              <div className="resumo-item">
                <span>Valor da Conta:</span>
                <span>{formatMoney(form.valorConta)}</span>
              </div>
              <div className="resumo-item">
                <span>Valor Enviado (com taxa):</span>
                <span className="valor-destaque">{formatMoney(form.valorComTaxa)}</span>
              </div>
              <div className="resumo-item">
                <span>Código de Barras:</span>
                <span>{form.codigoBarras || '-'}</span>
              </div>
              <div className="resumo-item">
                <span>Fatura Anexada:</span>
                <span>{form.faturaNome || 'Não'}</span>
              </div>
              {form.observacoes && (
                <div className="resumo-item">
                  <span>Suas Observações:</span>
                  <span>{form.observacoes}</span>
                </div>
              )}
            </div>
            
            <div className="step-actions">
              <Button variant="secondary" onClick={handleVoltarStep}>
                ← Voltar
              </Button>
              <Button variant="danger" onClick={handleCancelar}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleEnviarSolicitacao} disabled={loading}>
                {loading ? '⏳ Enviando...' : '✅ Confirmar Solicitação'}
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {/* HISTÓRICO DE SOLICITAÇÕES */}
      <Card title="📜 Histórico de Solicitações">
        {loadingHistorico ? (
          <Loading message="Carregando histórico..." />
        ) : (
          <DataTable
            columns={[
              { header: 'ID', render: (row) => `#${row.id}` },
              { header: 'Data', render: (row) => formatDateTime(row.created_at) },
              { header: 'Valor Conta', render: (row) => formatMoney(row.valor_original) },
              { header: 'Valor Enviado', render: (row) => formatMoney(row.valor_com_taxa) },
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
                  <Button variant="secondary" size="sm" onClick={() => handleVerDetalhes(row)}>
                    👁️ Detalhes
                  </Button>
                )
              }
            ]}
            data={solicitacoes}
            emptyState={
              <EmptyState
                icon="📋"
                title="Nenhuma solicitação"
                description="Você ainda não fez nenhuma solicitação de pagamento."
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
          <div className="detalhes-solicitacao">
            <div className="detalhe-header">
              <Badge type={getStatusBadge(modalDetalhes.status).type}>
                {getStatusBadge(modalDetalhes.status).text}
              </Badge>
            </div>
            
            <div className="detalhe-grid">
              <div className="detalhe-item">
                <label>Valor Desejado:</label>
                <span className="valor-grande">{formatMoney(modalDetalhes.valor_original)}</span>
              </div>
              <div className="detalhe-item">
                <label>Taxa (3%):</label>
                <span>{formatMoney(modalDetalhes.valor_com_taxa - modalDetalhes.valor_original)}</span>
              </div>
              <div className="detalhe-item">
                <label>Total Enviado:</label>
                <span className="valor-destaque">{formatMoney(modalDetalhes.valor_com_taxa)}</span>
              </div>
            </div>
            
            <div className="detalhe-item full">
              <label>ID de Transação:</label>
              <code>{modalDetalhes.transaction_id_revendedor}</code>
            </div>
            
            {modalDetalhes.codigo_barras && (
              <div className="detalhe-item full">
                <label>Código de Barras:</label>
                <code className="codigo-barras">{modalDetalhes.codigo_barras}</code>
              </div>
            )}
            
            {modalDetalhes.fatura_nome && (
              <div className="detalhe-item full">
                <label>Fatura Anexada:</label>
                {modalDetalhes.fatura_base64 ? (
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      downloadBase64File(modalDetalhes.fatura_base64, modalDetalhes.fatura_nome)
                      toast.success('Download iniciado!')
                    }}
                    style={{ marginTop: '8px' }}
                  >
                    📎 Baixar {modalDetalhes.fatura_nome}
                  </Button>
                ) : (
                  <span>📎 {modalDetalhes.fatura_nome}</span>
                )}
              </div>
            )}
            
            {modalDetalhes.observacoes_revendedor && (
              <div className="detalhe-item full" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid var(--purple)' }}>
                <label>Suas Observações:</label>
                <span>{modalDetalhes.observacoes_revendedor}</span>
              </div>
            )}
            
            <div className="detalhe-item full">
              <label>Criado em:</label>
              <span>{formatDateTime(modalDetalhes.created_at)}</span>
            </div>
            
            {modalDetalhes.observacoes_admin && (
              <div className="detalhe-item full observacao-admin">
                <label>Observações do Admin:</label>
                <span className="obs-text">{modalDetalhes.observacoes_admin}</span>
              </div>
            )}
            
            {modalDetalhes.status === 'pago' && modalDetalhes.comprovante_base64 && (
              <div className="detalhe-item full comprovante-box">
                <label>✅ Comprovante de Pagamento:</label>
                <Button 
                  variant="success"
                  onClick={() => {
                    downloadBase64File(modalDetalhes.comprovante_base64, modalDetalhes.comprovante_nome || 'comprovante.pdf')
                    toast.success('Download iniciado!')
                  }}
                >
                  📄 Baixar Comprovante
                </Button>
              </div>
            )}
            
            {modalDetalhes.status === 'pago' && (
              <div className="sucesso-box">
                <span>✅</span>
                <strong>Pagamento concluído!</strong>
                <p>Sua conta foi paga com sucesso.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageWrapper>
  )
}
