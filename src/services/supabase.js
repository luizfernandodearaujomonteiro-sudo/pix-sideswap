import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '../config/constants'

// Cliente Supabase
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)

// Helper para requests REST (compatibilidade com código antigo)
export async function supabaseRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : (method === 'PATCH' ? 'return=representation' : undefined)
    }
  }
  
  if (body) options.body = JSON.stringify(body)
  
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${endpoint}`, options)
    if (!response.ok) {
      const error = await response.text()
      console.error('Supabase error:', error)
      return null
    }
    const text = await response.text()
    return text ? JSON.parse(text) : null
  } catch (error) {
    console.error('Request error:', error)
    return null
  }
}

// ============ CONFIGURAÇÕES ============
export async function getConfiguracoes() {
  const { data, error } = await supabase
    .from('master_configuracoes')
    .select('chave, valor')
  
  if (error) {
    console.error('Erro ao buscar configurações:', error)
    return {}
  }
  
  const configMap = {}
  data?.forEach(c => configMap[c.chave] = c.valor)
  return configMap
}

export async function updateConfiguracao(chave, valor) {
  const { error } = await supabase
    .from('master_configuracoes')
    .update({ valor })
    .eq('chave', chave)
  
  return !error
}

// ============ PLANOS ============
export async function getPlanos() {
  const { data, error } = await supabase
    .from('master_planos')
    .select('*')
    .eq('ativo', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar planos:', error)
    return []
  }
  return data || []
}

export async function createPlano(plano) {
  const { data, error } = await supabase
    .from('master_planos')
    .insert(plano)
    .select()
  
  if (error) {
    console.error('Erro ao criar plano:', error)
    return null
  }
  return data?.[0]
}

export async function updatePlano(id, plano) {
  const { error } = await supabase
    .from('master_planos')
    .update(plano)
    .eq('id', id)
  
  return !error
}

export async function deletePlano(id) {
  const { error } = await supabase
    .from('master_planos')
    .update({ ativo: false })
    .eq('id', id)
  
  return !error
}

// ============ ASSOCIADOS ============
export async function getAssociados() {
  const { data, error } = await supabase
    .from('master_associados')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar associados:', error)
    return []
  }
  return data || []
}

export async function getAssociadoByCredentials(usuario, senha) {
  const { data, error } = await supabase
    .from('master_associados')
    .select('*')
    .eq('usuario', usuario)
    .eq('senha', senha)
    .single()
  
  if (error) {
    return null
  }
  return data
}

export async function createAssociado(associado) {
  const { data, error } = await supabase
    .from('master_associados')
    .insert(associado)
    .select()
  
  if (error) {
    console.error('Erro ao criar associado:', error)
    return null
  }
  return data?.[0]
}

export async function updateAssociado(id, associado) {
  const { error } = await supabase
    .from('master_associados')
    .update(associado)
    .eq('id', id)
  
  return !error
}

export async function deleteAssociado(id) {
  const { error } = await supabase
    .from('master_associados')
    .delete()
    .eq('id', id)
  
  return !error
}

// ============ VENDAS / LOGS PIX ============
export async function getVendasRevendedor(associadoId) {
  const { data, error } = await supabase
    .from('associado_logs_pix')
    .select('*')
    .eq('associado_id', associadoId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar vendas:', error)
    return []
  }
  return data || []
}

export async function getTodasVendas() {
  const { data, error } = await supabase
    .from('associado_logs_pix')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar todas vendas:', error)
    return []
  }
  return data || []
}

export async function getVendasPorPeriodo(inicioMes, fimMes) {
  const { data, error } = await supabase
    .from('associado_logs_pix')
    .select('*')
    .gte('created_at', inicioMes)
    .lte('created_at', fimMes)
    .eq('status', 'paid')
  
  if (error) {
    console.error('Erro ao buscar vendas por período:', error)
    return []
  }
  return data || []
}

// ============ RENOVAÇÕES ============
export async function getRenovacoesPendentes() {
  const { data, error } = await supabase
    .from('renovacoes_pendentes')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar renovações:', error)
    return []
  }
  return data || []
}

export async function aprovarRenovacao(renovacaoId, associadoId, novoVencimento) {
  // Atualizar vencimento do associado
  await supabase
    .from('master_associados')
    .update({ data_vencimento: novoVencimento })
    .eq('id', associadoId)
  
  // Marcar renovação como paga
  await supabase
    .from('renovacoes_pendentes')
    .update({ status: 'pago', paid_at: new Date().toISOString() })
    .eq('id', renovacaoId)
  
  return true
}

// ============ LOGS PIX (GERAL) ============
export async function getLogsPix() {
  const { data, error } = await supabase
    .from('logs_pix')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  
  if (error) {
    console.error('Erro ao buscar logs:', error)
    return []
  }
  return data || []
}

export async function createLogPix(log) {
  const { data, error } = await supabase
    .from('logs_pix')
    .insert(log)
    .select()
  
  if (error) {
    console.error('Erro ao criar log:', error)
    return null
  }
  return data?.[0]
}
