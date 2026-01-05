import { useState, useEffect } from 'react'
import { PageWrapper } from '../components/Layout'
import { Card, DataTable, EmptyState, Loading, Button } from '../components/UI'
import { getAssociados, getVendasPorPeriodo } from '../services/supabase'
import { formatMoney, gerarMesesFiltro } from '../utils/helpers'
import toast from 'react-hot-toast'

export function ResumoRevendedores() {
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState([])
  const [meses, setMeses] = useState([])
  const [mesSelecionado, setMesSelecionado] = useState('')
  const [mesLabel, setMesLabel] = useState('')
  
  useEffect(() => {
    // Inicializar filtro de meses
    const mesesFiltro = gerarMesesFiltro(6)
    setMeses(mesesFiltro)
    setMesSelecionado(mesesFiltro[0]?.value || '')
    setMesLabel(mesesFiltro[0]?.label || '')
  }, [])
  
  useEffect(() => {
    if (mesSelecionado) {
      loadResumo()
    }
  }, [mesSelecionado])
  
  const loadResumo = async () => {
    setLoading(true)
    
    try {
      const [ano, mes] = mesSelecionado.split('-')
      
      // Calcular início e fim do mês
      const inicioMes = `${ano}-${mes}-01T00:00:00`
      const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate()
      const fimMes = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}T23:59:59`
      
      // Buscar dados
      const [associadosData, vendasData] = await Promise.all([
        getAssociados(),
        getVendasPorPeriodo(inicioMes, fimMes)
      ])
      
      // Agrupar por associado
      const resumoPorAssociado = {}
      
      // Inicializar com todos os associados
      associadosData.forEach(a => {
        resumoPorAssociado[a.id] = {
          id: a.id,
          nome: a.nome,
          usuario: a.usuario,
          qtdVendas: 0,
          totalVendido: 0
        }
      })
      
      // Somar vendas
      vendasData.forEach(v => {
        const assocId = v.associado_id
        if (!assocId || !resumoPorAssociado[assocId]) return
        
        resumoPorAssociado[assocId].qtdVendas++
        resumoPorAssociado[assocId].totalVendido += parseFloat(v.valor) || 0
      })
      
      // Ordenar por total vendido (decrescente)
      const resumoOrdenado = Object.values(resumoPorAssociado)
        .sort((a, b) => b.totalVendido - a.totalVendido)
      
      setResumo(resumoOrdenado)
      
      // Calcular totais gerais
      const totalGeral = resumoOrdenado.reduce((sum, r) => sum + r.totalVendido, 0)
      const qtdTotal = resumoOrdenado.reduce((sum, r) => sum + r.qtdVendas, 0)
      
      toast.success(`${qtdTotal} vendas | Total: ${formatMoney(totalGeral)}`)
    } catch (error) {
      console.error('Erro ao carregar resumo:', error)
      toast.error('Erro ao carregar resumo')
    }
    
    setLoading(false)
  }
  
  const handleMesChange = (e) => {
    const valor = e.target.value
    setMesSelecionado(valor)
    const mes = meses.find(m => m.value === valor)
    setMesLabel(mes?.label || '')
  }
  
  // Calcular totais
  const totalGeral = resumo.reduce((sum, r) => sum + r.totalVendido, 0)
  const qtdTotal = resumo.reduce((sum, r) => sum + r.qtdVendas, 0)
  
  return (
    <PageWrapper title="Resumo Revendedores" subtitle={`Vendas de ${mesLabel}`}>
      <div className="commission-total">
        <div className="commission-total-label">Total Vendido em {mesLabel}</div>
        <div className="commission-total-value">{formatMoney(totalGeral)}</div>
      </div>
      
      <Card 
        title="Vendas por Revendedor"
        actions={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '8px 32px 8px 12px' }}
              value={mesSelecionado}
              onChange={handleMesChange}
            >
              {meses.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={loadResumo} disabled={loading}>
              🔄 {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        }
      >
        {loading ? (
          <Loading message="Carregando resumo..." />
        ) : (
          <DataTable
            columns={[
              { header: 'Revendedor', render: (row) => <strong>{row.nome}</strong> },
              { header: 'Usuário', accessor: 'usuario' },
              { header: 'Qtd. Vendas', accessor: 'qtdVendas' },
              { 
                header: 'Total Vendido', 
                render: (row) => (
                  <strong style={{ color: row.totalVendido > 0 ? 'var(--accent)' : 'inherit' }}>
                    {formatMoney(row.totalVendido)}
                  </strong>
                )
              }
            ]}
            data={resumo}
            emptyState={
              <EmptyState 
                icon="📊" 
                title="Nenhum revendedor encontrado" 
                description="Cadastre associados para ver o resumo de vendas." 
              />
            }
          />
        )}
        
        {resumo.length > 0 && (
          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            background: 'var(--bg-elevated)', 
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span><strong>Total Geral:</strong></span>
            <div>
              <span style={{ marginRight: '24px' }}>{qtdTotal} vendas</span>
              <strong style={{ color: 'var(--accent)', fontSize: '18px' }}>
                {formatMoney(totalGeral)}
              </strong>
            </div>
          </div>
        )}
      </Card>
    </PageWrapper>
  )
}
