import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageWrapper } from '../components/Layout'
import { Card, DataTable, StatCard, Badge, EmptyState, Loading, Pagination, Button } from '../components/UI'
import { buscarTransacoesPagas, traduzirStatus } from '../services/api'
import { getConfiguracoes, getVendasRevendedor } from '../services/supabase'
import { formatMoney, formatDateTime } from '../utils/helpers'
import toast from 'react-hot-toast'

export function Vendas() {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [vendas, setVendas] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  useEffect(() => {
    loadVendas()
  }, [])
  
  const loadVendas = async (silencioso = false) => {
    if (!silencioso) setLoading(true)
    
    try {
      if (isAdmin()) {
        // Admin busca da API externa
        const configs = await getConfiguracoes()
        const apiKey = configs.api_key || ''
        
        if (!apiKey && !silencioso) {
          toast.error('Configure sua API Key em Configurações!')
        }
        
        const transacoes = await buscarTransacoesPagas(1000, apiKey)
        const vendasPagas = transacoes.filter(t => t.status === 'paid')
        setVendas(vendasPagas)
        
        if (!silencioso) {
          toast.success(`${vendasPagas.length} vendas carregadas!`)
        }
      } else {
        // Revendedor busca do Supabase
        const vendasData = await getVendasRevendedor(user.id)
        setVendas(vendasData.map(v => ({
          id: v.id_transacao,
          cliente: v.cliente,
          valorBruto: parseFloat(v.valor) || 0,
          valorLiquido: parseFloat(v.valor) || 0,
          status: v.status,
          dataPagamento: v.created_at
        })))
        
        if (!silencioso) {
          toast.success(`${vendasData.length} vendas carregadas!`)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar vendas:', error)
      if (!silencioso) toast.error('Erro ao buscar vendas')
    }
    
    if (!silencioso) setLoading(false)
  }
  
  // Calcular totais
  const totalVendas = vendas.length
  const totalRecebido = vendas.reduce((sum, v) => sum + (v.valorLiquido || v.valorBruto || 0), 0)
  
  // Paginação
  const totalPages = Math.ceil(vendas.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedVendas = vendas.slice(startIndex, startIndex + itemsPerPage)
  
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value))
    setCurrentPage(1)
  }
  
  return (
    <PageWrapper title="Minhas Vendas" subtitle="Histórico de transações">
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <StatCard 
          icon="🛒" 
          value={totalVendas} 
          label="Vendas Realizadas" 
          color="green" 
        />
        <StatCard 
          icon="💰" 
          value={formatMoney(totalRecebido)} 
          label="Total Recebido" 
          color="blue" 
        />
      </div>
      
      <Card 
        title="Histórico de Vendas"
        actions={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '8px 32px 8px 12px' }}
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value="20">20 por página</option>
              <option value="50">50 por página</option>
              <option value="100">100 por página</option>
            </select>
            <Button variant="secondary" size="sm" onClick={() => loadVendas()} disabled={loading}>
              🔄 {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        }
      >
        {loading && vendas.length === 0 ? (
          <Loading message="Carregando vendas..." />
        ) : (
          <>
            <DataTable
              columns={[
                { header: 'ID', render: (row) => `#${row.id}` },
                { header: 'Cliente', accessor: 'cliente' },
                { header: 'Valor Bruto', render: (row) => formatMoney(row.valorBruto) },
                { header: 'Valor Líquido', render: (row) => formatMoney(row.valorLiquido || row.valorBruto) },
                { header: 'Data', render: (row) => formatDateTime(row.dataPagamento) },
                { 
                  header: 'Status', 
                  render: (row) => {
                    const status = traduzirStatus(row.status)
                    return <Badge type={status.type}>{status.text}</Badge>
                  }
                }
              ]}
              data={paginatedVendas}
              emptyState={
                <EmptyState 
                  icon="🛒" 
                  title="Nenhuma venda encontrada" 
                  description="Clique em Atualizar para buscar suas vendas." 
                />
              }
            />
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={vendas.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </Card>
    </PageWrapper>
  )
}
