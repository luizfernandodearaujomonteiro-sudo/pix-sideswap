import { useState, useEffect } from 'react'
import { PageWrapper } from '../components/Layout'
import { Card, DataTable, EmptyState, Loading, Modal, Button } from '../components/UI'
import { getPlanos, createPlano, updatePlano, deletePlano } from '../services/supabase'
import { formatMoney } from '../utils/helpers'
import toast from 'react-hot-toast'

export function Planos() {
  const [loading, setLoading] = useState(true)
  const [planos, setPlanos] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const [form, setForm] = useState({
    nome: '',
    valor: '',
    descricao: ''
  })
  
  useEffect(() => {
    loadPlanos()
  }, [])
  
  const loadPlanos = async () => {
    setLoading(true)
    const planosData = await getPlanos()
    setPlanos(planosData)
    setLoading(false)
  }
  
  const openNewModal = () => {
    setEditingId(null)
    setForm({ nome: '', valor: '', descricao: '' })
    setModalOpen(true)
  }
  
  const openEditModal = (plano) => {
    setEditingId(plano.id)
    setForm({
      nome: plano.nome,
      valor: plano.valor,
      descricao: plano.descricao || ''
    })
    setModalOpen(true)
  }
  
  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
  }
  
  const handleSubmit = async () => {
    if (!form.nome || !form.valor) {
      toast.error('Preencha nome e valor do plano')
      return
    }
    
    setLoading(true)
    
    const planoData = {
      nome: form.nome,
      valor: parseFloat(form.valor),
      descricao: form.descricao
    }
    
    try {
      if (editingId) {
        await updatePlano(editingId, planoData)
        toast.success('Plano atualizado com sucesso!')
      } else {
        await createPlano(planoData)
        toast.success('Plano criado com sucesso!')
      }
      
      await loadPlanos()
      closeModal()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar plano')
    }
    
    setLoading(false)
  }
  
  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este plano?')) return
    
    setLoading(true)
    await deletePlano(id)
    toast.success('Plano excluído com sucesso!')
    await loadPlanos()
    setLoading(false)
  }
  
  if (loading && planos.length === 0) {
    return (
      <PageWrapper title="Planos" subtitle="Gerenciar planos">
        <Loading />
      </PageWrapper>
    )
  }
  
  return (
    <PageWrapper title="Planos" subtitle="Gerenciar planos disponíveis">
      <Card 
        title="Gerenciar Planos"
        actions={
          <Button variant="primary" size="sm" onClick={openNewModal}>
            ➕ Novo Plano
          </Button>
        }
      >
        <DataTable
          columns={[
            { header: 'Nome', render: (row) => <strong>{row.nome}</strong> },
            { header: 'Valor', render: (row) => formatMoney(row.valor) },
            { header: 'Descrição', render: (row) => row.descricao || '-' },
            {
              header: 'Ações',
              render: (row) => (
                <div className="action-buttons">
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
          data={planos}
          emptyState={
            <EmptyState 
              icon="📋" 
              title="Nenhum plano cadastrado" 
              description="Clique em 'Novo Plano' para começar." 
            />
          }
        />
      </Card>
      
      {/* Modal de Novo/Editar Plano */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar Plano' : 'Novo Plano'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label>Nome do Plano</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Ex: Plano Básico"
            value={form.nome}
            onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
          />
        </div>
        
        <div className="form-group">
          <label>Valor Mensal (R$)</label>
          <input 
            type="number" 
            className="form-input" 
            placeholder="0,00"
            step="0.01"
            value={form.valor}
            onChange={(e) => setForm(prev => ({ ...prev, valor: e.target.value }))}
          />
        </div>
        
        <div className="form-group">
          <label>Descrição</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Descrição do plano"
            value={form.descricao}
            onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
          />
        </div>
      </Modal>
    </PageWrapper>
  )
}
