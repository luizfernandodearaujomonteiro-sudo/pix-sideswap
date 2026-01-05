import { useState, useEffect } from 'react'
import { PageWrapper } from '../components/Layout'
import { Card, DataTable, Badge, EmptyState, Loading, Modal, Button } from '../components/UI'
import { getAssociados, getPlanos, createAssociado, updateAssociado, deleteAssociado } from '../services/supabase'
import { formatMoney, formatDate, getStatusVencimento, gerarSenhaAleatoria, copyToClipboard } from '../utils/helpers'
import { CONFIG } from '../config/constants'
import toast from 'react-hot-toast'

export function Associados() {
  const [loading, setLoading] = useState(true)
  const [associados, setAssociados] = useState([])
  const [planos, setPlanos] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSuccess, setModalSuccess] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [dadosWhatsapp, setDadosWhatsapp] = useState('')
  
  const [form, setForm] = useState({
    nome: '',
    usuario: '',
    plano_id: '',
    data_vencimento: '',
    valor: 0
  })
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setLoading(true)
    const [associadosData, planosData] = await Promise.all([
      getAssociados(),
      getPlanos()
    ])
    setAssociados(associadosData)
    setPlanos(planosData)
    setLoading(false)
  }
  
  const openNewModal = () => {
    setEditingId(null)
    setModalSuccess(false)
    setForm({
      nome: '',
      usuario: '',
      plano_id: '',
      data_vencimento: '',
      valor: 0
    })
    setModalOpen(true)
  }
  
  const openEditModal = (associado) => {
    setEditingId(associado.id)
    setModalSuccess(false)
    setForm({
      nome: associado.nome,
      usuario: associado.usuario,
      plano_id: associado.plano_id,
      data_vencimento: associado.data_vencimento,
      valor: associado.valor
    })
    setModalOpen(true)
  }
  
  const closeModal = () => {
    setModalOpen(false)
    setModalSuccess(false)
    setEditingId(null)
  }
  
  const handlePlanoChange = (planoId) => {
    const plano = planos.find(p => p.id === planoId)
    setForm(prev => ({
      ...prev,
      plano_id: planoId,
      valor: plano?.valor || 0
    }))
  }
  
  const handleSubmit = async () => {
    if (!form.nome || !form.usuario || !form.plano_id || !form.data_vencimento) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    
    setLoading(true)
    
    const plano = planos.find(p => p.id === form.plano_id)
    const senhaGerada = editingId ? null : gerarSenhaAleatoria(8)
    
    const associadoData = {
      nome: form.nome,
      usuario: form.usuario.toLowerCase().replace(/\s+/g, ''),
      plano_id: form.plano_id,
      valor: plano?.valor || 0,
      data_vencimento: form.data_vencimento,
      webhook_gerar_pix: CONFIG.WEBHOOKS.gerarPix,
      webhook_verificar_pagamento: CONFIG.WEBHOOKS.verificarPagamento,
      webhook_verificar_transacao: CONFIG.WEBHOOKS.verificarTransacao
    }
    
    if (!editingId) {
      associadoData.senha = senhaGerada
      associadoData.primeiro_acesso = true
    }
    
    try {
      if (editingId) {
        await updateAssociado(editingId, associadoData)
        toast.success('Associado atualizado com sucesso!')
        closeModal()
      } else {
        const result = await createAssociado(associadoData)
        
        if (result) {
          // Gerar texto para WhatsApp
          const textoWhatsapp = `🎉 *Bem-vindo ao Sistema!*

👤 *Seus dados de acesso:*

📧 Usuário: *${associadoData.usuario}*
🔐 Senha: *${senhaGerada}*

📋 *Plano:* ${plano?.nome}
💰 *Valor:* ${formatMoney(plano?.valor)}
📅 *Vencimento:* ${formatDate(form.data_vencimento)}

🔗 *Acesse seu painel:*
${CONFIG.URL_PAINEL_CLIENTE}${associadoData.usuario}/

⚠️ _No primeiro acesso, você deverá trocar sua senha._

Qualquer dúvida, estou à disposição! 😊`

          setDadosWhatsapp(textoWhatsapp)
          setModalSuccess(true)
          toast.success('Associado criado com sucesso!')
        }
      }
      
      await loadData()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar associado')
    }
    
    setLoading(false)
  }
  
  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este associado?')) return
    
    setLoading(true)
    await deleteAssociado(id)
    toast.success('Associado excluído com sucesso!')
    await loadData()
    setLoading(false)
  }
  
  const handleCopyData = async (id) => {
    const associado = associados.find(a => a.id === id)
    if (!associado) return
    
    const plano = planos.find(p => p.id === associado.plano_id)
    
    const texto = `🎉 *Seus dados de acesso:*

👤 Usuário: *${associado.usuario}*
🔐 Senha: *${associado.senha}*

📋 *Plano:* ${plano?.nome || '-'}
💰 *Valor:* ${formatMoney(associado.valor)}
📅 *Vencimento:* ${formatDate(associado.data_vencimento)}

🔗 *Acesse seu painel:*
${CONFIG.URL_PAINEL_CLIENTE}${associado.usuario}/

Qualquer dúvida, estou à disposição! 😊`

    await copyToClipboard(texto)
    toast.success('Dados copiados para a área de transferência!')
  }
  
  const handleCopyWhatsapp = async () => {
    await copyToClipboard(dadosWhatsapp)
    toast.success('Dados copiados para a área de transferência!')
  }
  
  if (loading && associados.length === 0) {
    return (
      <PageWrapper title="Associados" subtitle="Gerenciar associados">
        <Loading />
      </PageWrapper>
    )
  }
  
  return (
    <PageWrapper title="Associados" subtitle="Gerenciar associados">
      <Card 
        title="Gerenciar Associados"
        actions={
          <Button variant="primary" size="sm" onClick={openNewModal}>
            ➕ Novo Associado
          </Button>
        }
      >
        <DataTable
          columns={[
            { header: 'Nome', render: (row) => <strong>{row.nome}</strong> },
            { header: 'Usuário', accessor: 'usuario' },
            { header: 'Plano', render: (row) => planos.find(p => p.id === row.plano_id)?.nome || '-' },
            { header: 'Valor', render: (row) => formatMoney(row.valor) },
            { header: 'Vencimento', render: (row) => formatDate(row.data_vencimento) },
            { 
              header: 'Status', 
              render: (row) => {
                const status = getStatusVencimento(row.data_vencimento)
                return <Badge type={status.type}>{status.text}</Badge>
              }
            },
            {
              header: 'Ações',
              render: (row) => (
                <div className="action-buttons">
                  <Button variant="whatsapp" icon onClick={() => handleCopyData(row.id)} title="Copiar dados">
                    📋
                  </Button>
                  <Button variant="secondary" icon onClick={() => openEditModal(row)} title="Editar">
                    ✏️
                  </Button>
                  <Button variant="danger" icon onClick={() => handleDelete(row.id)} title="Excluir">
                    🗑️
                  </Button>
                </div>
              )
            }
          ]}
          data={associados}
          emptyState={
            <EmptyState 
              icon="👥" 
              title="Nenhum associado cadastrado" 
              description="Clique em 'Novo Associado' para começar." 
            />
          }
        />
      </Card>
      
      {/* Modal de Novo/Editar Associado */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar Associado' : 'Novo Associado'}
        size="lg"
        footer={
          !modalSuccess && (
            <>
              <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )
        }
      >
        {!modalSuccess ? (
          <div className="form-grid">
            <div className="form-group full">
              <label>Nome Completo</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Nome do associado"
                value={form.nome}
                onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            
            <div className="form-group">
              <label>Usuário (login)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="username"
                value={form.usuario}
                onChange={(e) => setForm(prev => ({ ...prev, usuario: e.target.value }))}
              />
            </div>
            
            <div className="form-group">
              <label>Plano</label>
              <select 
                className="form-select"
                value={form.plano_id}
                onChange={(e) => handlePlanoChange(e.target.value)}
              >
                <option value="">Selecione um plano</option>
                {planos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - {formatMoney(p.valor)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Data de Vencimento</label>
              <input 
                type="date" 
                className="form-input"
                value={form.data_vencimento}
                onChange={(e) => setForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
              />
            </div>
            
            <div className="form-group">
              <label>Valor (R$)</label>
              <input 
                type="number" 
                className="form-input"
                value={form.valor}
                readOnly
              />
            </div>
          </div>
        ) : (
          <>
            <div className="success-box">
              <div className="success-box-icon">✅</div>
              <h3>Associado Criado com Sucesso!</h3>
              <p>Copie os dados abaixo e envie para o cliente.</p>
            </div>
            
            <div className="copy-box">
              <div className="copy-box-header">
                <span className="copy-box-title">📋 Dados para enviar ao cliente</span>
                <Button variant="whatsapp" size="sm" onClick={handleCopyWhatsapp}>
                  📋 Copiar para WhatsApp
                </Button>
              </div>
              <div className="copy-box-content">{dadosWhatsapp}</div>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Button variant="secondary" onClick={closeModal}>Fechar</Button>
            </div>
          </>
        )}
      </Modal>
    </PageWrapper>
  )
}
