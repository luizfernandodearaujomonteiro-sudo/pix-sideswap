import { useState, useEffect } from 'react'
import { PageWrapper } from '../components/Layout'
import { Card, DataTable, Badge, EmptyState, Loading, Button } from '../components/UI'
import { getRenovacoesPendentes, aprovarRenovacao, getAssociados, getPlanos } from '../services/supabase'
import { verificarTransacao } from '../services/api'
import { getConfiguracoes } from '../services/supabase'
import { formatMoney, formatDate, formatDateTime, calcularNovoVencimento } from '../utils/helpers'
import toast from 'react-hot-toast'

export function Renovacoes() {
  const [loading, setLoading] = useState(true)
  const [renovacoes, setRenovacoes] = useState([])
  const [associados, setAssociados] = useState([])
  const [planos, setPlanos] = useState([])
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setLoading(true)
    
    try {
      const [renovacoesData, associadosData, planosData] = await Promise.all([
        getRenovacoesPendentes(),
        getAssociados(),
        getPlanos()
      ])
      
      setRenovacoes(renovacoesData)
      setAssociados(associadosData)
      setPlanos(planosData)
    } catch (error) {
      console.error('Erro ao carregar renovações:', error)
    }
    
    setLoading(false)
  }
  
  const handleVerificar = async (idTransacao) => {
    setLoading(true)
    
    try {
      const configs = await getConfiguracoes()
      const apiKey = configs.api_key || ''
      
      const result = await verificarTransacao(idTransacao, apiKey)
      
      if (result.success) {
        const status = result.status?.toLowerCase()
        
        if (['paid', 'approved', 'confirmed'].includes(status)) {
          toast.success('✅ Pagamento CONFIRMADO! Clique em Aprovar para renovar.')
        } else if (['pending', 'waiting'].includes(status)) {
          toast.warning('⏳ Pagamento ainda PENDENTE')
        } else {
          toast.warning(`Status: ${status?.toUpperCase() || 'Desconhecido'}`)
        }
      } else {
        toast.error('Erro ao verificar pagamento')
      }
    } catch (error) {
      console.error('Erro ao verificar:', error)
      toast.error('Erro ao verificar pagamento')
    }
    
    setLoading(false)
  }
  
  const handleAprovar = async (renovacao) => {
    if (!confirm('Confirma a aprovação desta renovação?')) return
    
    setLoading(true)
    
    try {
      const associado = associados.find(a => a.id === renovacao.associado_id)
      if (!associado) {
        toast.error('Associado não encontrado')
        setLoading(false)
        return
      }
      
      // Calcular novo vencimento (1 mês a partir do atual)
      const novoVencimento = calcularNovoVencimento(associado.data_vencimento, 1)
      
      await aprovarRenovacao(renovacao.id, renovacao.associado_id, novoVencimento)
      
      toast.success(`Renovação aprovada! Novo vencimento: ${formatDate(novoVencimento)}`)
      await loadData()
    } catch (error) {
      console.error('Erro ao aprovar:', error)
      toast.error('Erro ao aprovar renovação')
    }
    
    setLoading(false)
  }
  
  // Mapear dados para exibição
  const renovacoesComDados = renovacoes.map(r => {
    const associado = associados.find(a => a.id === r.associado_id)
    const plano = planos.find(p => p.id === associado?.plano_id)
    
    return {
      ...r,
      associadoNome: associado?.nome || '-',
      associadoUsuario: associado?.usuario || '-',
      planoNome: plano?.nome || '-',
      vencimentoAtual: associado?.data_vencimento
    }
  })
  
  return (
    <PageWrapper title="Renovações" subtitle="Renovações pendentes">
      <Card 
        title="Renovações Pendentes"
        actions={
          <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
            🔄 {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        }
      >
        {loading && renovacoes.length === 0 ? (
          <Loading message="Carregando renovações..." />
        ) : (
          <DataTable
            columns={[
              { header: 'ID Trans.', render: (row) => `#${row.id_transacao || '-'}` },
              { header: 'Associado', render: (row) => <strong>{row.associadoNome}</strong> },
              { header: 'Usuário', accessor: 'associadoUsuario' },
              { header: 'Plano', accessor: 'planoNome' },
              { header: 'Valor', render: (row) => formatMoney(row.valor) },
              { header: 'Venc. Atual', render: (row) => formatDate(row.vencimentoAtual) },
              { header: 'Solicitado em', render: (row) => formatDateTime(row.created_at) },
              { 
                header: 'Status', 
                render: () => <Badge type="warning">PENDENTE</Badge>
              },
              {
                header: 'Ações',
                render: (row) => (
                  <div className="action-buttons">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleVerificar(row.id_transacao)}
                    >
                      🔍 Verificar
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleAprovar(row)}
                    >
                      ✅ Aprovar
                    </Button>
                  </div>
                )
              }
            ]}
            data={renovacoesComDados}
            emptyState={
              <EmptyState 
                icon="🔄" 
                title="Nenhuma renovação pendente" 
                description="As renovações pendentes aparecerão aqui." 
              />
            }
          />
        )}
      </Card>
    </PageWrapper>
  )
}
