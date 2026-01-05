import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageWrapper } from '../components/Layout'
import { Card, DataTable, Badge, EmptyState, Loading, Button } from '../components/UI'
import { getVendasRevendedor } from '../services/supabase'
import { traduzirStatus } from '../services/api'
import { formatMoney, formatDateTime } from '../utils/helpers'
import toast from 'react-hot-toast'

export function LogsPix() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('todos')
  
  useEffect(() => {
    loadLogs()
  }, [])
  
  const loadLogs = async () => {
    setLoading(true)
    
    try {
      const logsData = await getVendasRevendedor(user.id)
      setLogs(logsData || [])
      toast.success(`${logsData?.length || 0} registros carregados`)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      toast.error('Erro ao carregar logs')
    }
    
    setLoading(false)
  }
  
  // Filtrar por status
  const logsFiltrados = logs.filter(log => {
    if (filtroStatus === 'todos') return true
    return log.status === filtroStatus
  })
  
  // Calcular estatísticas
  const stats = {
    total: logs.length,
    pagos: logs.filter(l => l.status === 'paid').length,
    pendentes: logs.filter(l => l.status === 'pending').length,
    expirados: logs.filter(l => l.status === 'expired').length
  }
  
  return (
    <PageWrapper title="Logs de Códigos" subtitle="Histórico de PIX gerados">
      <Card 
        title="Logs de Códigos Gerados"
        actions={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '8px 32px 8px 12px' }}
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todos">📋 Todos ({stats.total})</option>
              <option value="paid">✅ Pagos ({stats.pagos})</option>
              <option value="pending">⏳ Pendentes ({stats.pendentes})</option>
              <option value="expired">❌ Expirados ({stats.expirados})</option>
            </select>
            <Button variant="secondary" size="sm" onClick={loadLogs} disabled={loading}>
              🔄 {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        }
      >
        {loading && logs.length === 0 ? (
          <Loading message="Carregando logs..." />
        ) : (
          <DataTable
            columns={[
              { header: 'ID', render: (row) => `#${row.id_transacao || '-'}` },
              { header: 'Data/Hora', render: (row) => formatDateTime(row.created_at) },
              { header: 'Cliente', accessor: 'cliente' },
              { header: 'Valor', render: (row) => formatMoney(row.valor) },
              { 
                header: 'Status', 
                render: (row) => {
                  const status = traduzirStatus(row.status)
                  return <Badge type={status.type}>{status.text}</Badge>
                }
              }
            ]}
            data={logsFiltrados}
            emptyState={
              <EmptyState 
                icon="📋" 
                title="Nenhum código gerado" 
                description="Seus QR Codes aparecerão aqui." 
              />
            }
          />
        )}
      </Card>
    </PageWrapper>
  )
}
