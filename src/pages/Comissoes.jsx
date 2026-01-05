import { useState, useEffect } from 'react'
import { PageWrapper } from '../components/Layout'
import { Card, DataTable, StatCard, EmptyState, Loading, Button } from '../components/UI'
import { getTodasVendas, getAssociados } from '../services/supabase'
import { formatMoney, formatDateTime } from '../utils/helpers'
import toast from 'react-hot-toast'

export function Comissoes() {
  const [loading, setLoading] = useState(true)
  const [comissoes, setComissoes] = useState([])
  const [totalComissao, setTotalComissao] = useState(0)
  const [qtdComissoes, setQtdComissoes] = useState(0)
  
  useEffect(() => {
    loadComissoes()
  }, [])
  
  const loadComissoes = async () => {
    setLoading(true)
    
    try {
      // Buscar vendas PAGAS dos revendedores
      const [vendasData, associadosData] = await Promise.all([
        getTodasVendas(),
        getAssociados()
      ])
      
      // Criar mapa de associados
      const assocMap = {}
      associadosData.forEach(a => { assocMap[a.id] = a.nome })
      
      // Filtrar vendas pagas e calcular comissões (1%)
      const vendasPagas = vendasData.filter(v => v.status === 'paid')
      
      const comissoesCalculadas = vendasPagas.map(v => ({
        id_transacao: v.id_transacao,
        cliente: v.cliente || '-',
        revendedor: assocMap[v.associado_id] || 'Desconhecido',
        valor_bruto: parseFloat(v.valor) || 0,
        comissao: (parseFloat(v.valor) || 0) * 0.01, // 1%
        data: v.created_at
      }))
      
      // Calcular totais
      const total = comissoesCalculadas.reduce((sum, c) => sum + c.comissao, 0)
      
      setComissoes(comissoesCalculadas)
      setTotalComissao(total)
      setQtdComissoes(comissoesCalculadas.length)
      
      toast.success(`${comissoesCalculadas.length} vendas | Comissão total: ${formatMoney(total)}`)
    } catch (error) {
      console.error('Erro ao buscar comissões:', error)
      toast.error('Erro ao buscar comissões')
    }
    
    setLoading(false)
  }
  
  return (
    <PageWrapper title="Comissões" subtitle="Comissões dos revendedores (1%)">
      <div className="commission-total">
        <div className="commission-total-label">Total de Comissões</div>
        <div className="commission-total-value">{formatMoney(totalComissao)}</div>
      </div>
      
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <StatCard 
          icon="💰" 
          value={formatMoney(totalComissao)} 
          label="Comissão Total" 
          color="green" 
        />
        <StatCard 
          icon="📊" 
          value={qtdComissoes} 
          label="Qtd. Vendas" 
          color="blue" 
        />
      </div>
      
      <Card 
        title="Histórico de Comissões"
        actions={
          <Button variant="secondary" size="sm" onClick={loadComissoes} disabled={loading}>
            🔄 {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        }
      >
        {loading ? (
          <Loading message="Carregando comissões..." />
        ) : (
          <DataTable
            columns={[
              { header: 'ID', render: (row) => `#${row.id_transacao || '-'}` },
              { header: 'Revendedor', accessor: 'revendedor' },
              { header: 'Cliente', accessor: 'cliente' },
              { header: 'Valor Bruto', render: (row) => formatMoney(row.valor_bruto) },
              { 
                header: 'Comissão (1%)', 
                render: (row) => (
                  <strong style={{ color: 'var(--accent)' }}>
                    {formatMoney(row.comissao)}
                  </strong>
                )
              },
              { header: 'Data', render: (row) => formatDateTime(row.data) }
            ]}
            data={comissoes.slice(0, 100)}
            emptyState={
              <EmptyState 
                icon="💰" 
                title="Nenhuma comissão encontrada" 
                description="As comissões aparecerão quando os revendedores realizarem vendas." 
              />
            }
          />
        )}
      </Card>
    </PageWrapper>
  )
}
