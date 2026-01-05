import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageWrapper } from '../components/Layout'
import { StatCard, Card, DataTable, Badge, EmptyState, Loading } from '../components/UI'
import { getAssociados, getPlanos, getTodasVendas, getVendasRevendedor } from '../services/supabase'
import { formatMoney, formatDate, getStatusVencimento } from '../utils/helpers'

export function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    associados: 0,
    vencidos: 0,
    totalVendas: 0,
    comissoes: 0
  })
  const [recentAssociados, setRecentAssociados] = useState([])
  const [planos, setPlanos] = useState([])
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setLoading(true)
    
    try {
      if (isAdmin()) {
        // Dashboard do Admin
        const [associadosData, planosData, vendasData] = await Promise.all([
          getAssociados(),
          getPlanos(),
          getTodasVendas()
        ])
        
        setPlanos(planosData)
        
        // Calcular estatísticas
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        
        const ativos = associadosData.filter(a => {
          const venc = new Date(a.data_vencimento + 'T00:00:00')
          return venc >= hoje
        }).length
        
        const vencidos = associadosData.filter(a => {
          const venc = new Date(a.data_vencimento + 'T00:00:00')
          return venc < hoje
        }).length
        
        const vendasPagas = vendasData.filter(v => v.status === 'paid')
        const totalVendas = vendasPagas.reduce((sum, v) => sum + (parseFloat(v.valor) || 0), 0)
        const comissoes = totalVendas * 0.01 // 1% de comissão
        
        setStats({
          associados: ativos,
          vencidos,
          totalVendas,
          comissoes
        })
        
        setRecentAssociados(associadosData.slice(0, 5).map(a => ({
          ...a,
          planoNome: planosData.find(p => p.id === a.plano_id)?.nome || '-'
        })))
      } else {
        // Dashboard do Revendedor
        const vendasData = await getVendasRevendedor(user.id)
        const vendasPagas = vendasData.filter(v => v.status === 'paid')
        const totalVendas = vendasPagas.reduce((sum, v) => sum + (parseFloat(v.valor) || 0), 0)
        
        setStats({
          associados: vendasPagas.length,
          vencidos: 0,
          totalVendas,
          comissoes: 0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    }
    
    setLoading(false)
  }
  
  if (loading) {
    return (
      <PageWrapper title="Dashboard" subtitle="Carregando...">
        <Loading />
      </PageWrapper>
    )
  }
  
  // Dashboard do Admin
  if (isAdmin()) {
    return (
      <PageWrapper title="Dashboard" subtitle="Visão geral do sistema">
        <div className="stats-grid">
          <StatCard 
            icon="👥" 
            value={stats.associados} 
            label="Associados Ativos" 
            color="green" 
          />
          <StatCard 
            icon="🛒" 
            value={formatMoney(stats.totalVendas)} 
            label="Total em Vendas" 
            color="blue" 
          />
          <StatCard 
            icon="💰" 
            value={formatMoney(stats.comissoes)} 
            label="Comissões Revendedores" 
            color="purple" 
          />
          <StatCard 
            icon="⚠️" 
            value={stats.vencidos} 
            label="Vencidos" 
            color="yellow" 
          />
        </div>
        
        <Card title="Últimos Associados">
          <DataTable
            columns={[
              { header: 'Nome', render: (row) => <strong>{row.nome}</strong> },
              { header: 'Usuário', accessor: 'usuario' },
              { header: 'Plano', accessor: 'planoNome' },
              { header: 'Vencimento', render: (row) => formatDate(row.data_vencimento) },
              { 
                header: 'Status', 
                render: (row) => {
                  const status = getStatusVencimento(row.data_vencimento)
                  return <Badge type={status.type}>{status.text}</Badge>
                }
              }
            ]}
            data={recentAssociados}
            emptyState={
              <EmptyState 
                icon="👥" 
                title="Nenhum associado cadastrado" 
                description="Clique em Associados para começar." 
              />
            }
          />
        </Card>
      </PageWrapper>
    )
  }
  
  // Dashboard do Revendedor
  return (
    <PageWrapper title="Dashboard" subtitle={`Bem-vindo, ${user.nome}`}>
      <div className="stats-grid">
        <StatCard 
          icon="🛒" 
          value={stats.associados} 
          label="Vendas Realizadas" 
          color="green" 
        />
        <StatCard 
          icon="💰" 
          value={formatMoney(stats.totalVendas)} 
          label="Total Vendido" 
          color="blue" 
        />
      </div>
      
      <Card title="Seu Status">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong>Plano:</strong> {user.planoId || 'Não definido'}
          </div>
          <div>
            <strong>Vencimento:</strong> {user.dataVencimento ? formatDate(user.dataVencimento) : '-'}
            {user.dataVencimento && (
              <Badge type={getStatusVencimento(user.dataVencimento).type} style={{ marginLeft: '8px' }}>
                {getStatusVencimento(user.dataVencimento).text}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </PageWrapper>
  )
}
