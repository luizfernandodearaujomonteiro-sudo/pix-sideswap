import { CONFIG } from '../config/constants'

// Gerar PIX via webhook N8N
export async function gerarPix(nome, valor, apiKey = '') {
  try {
    const response = await fetch(CONFIG.WEBHOOKS.gerarPix, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nome, 
        valor: parseFloat(valor),
        api_key: apiKey 
      })
    })
    
    const rawData = await response.json()
    console.log('Resposta da API PIX:', rawData)
    
    // Extrair dados (N8N pode retornar diferentes estruturas)
    let data = rawData
    
    // Se for array, pega o primeiro item
    if (Array.isArray(rawData) && rawData[0]) {
      data = rawData[0]
    }
    
    // Se tiver .data, usa ele
    if (data.data) {
      data = data.data
    }
    
    // Se ainda tiver .data aninhado
    if (data.data) {
      data = data.data
    }
    
    console.log('Dados extraídos:', data)
    
    return {
      success: true,
      qrCode: data.qr_code || data.qr_code_imagem || data.qrCode,
      pixId: data.id,
      transactionId: data.depix_transaction_id || data.transaction_id,
      copiaCola: data.pix || data.pix_copia_cola || data.copiaCola || '',
      expiresAt: data.qr_code_expires_at
    }
  } catch (error) {
    console.error('Erro ao gerar PIX:', error)
    return { success: false, error: error.message }
  }
}

// Buscar transações pagas
export async function buscarTransacoesPagas(quantidade = 100, apiKey = '') {
  try {
    const response = await fetch(CONFIG.WEBHOOKS.verificarPagamento, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        quantidade: parseInt(quantidade),
        api_key: apiKey 
      })
    })
    
    const rawData = await response.json()
    
    let transacoes = []
    if (Array.isArray(rawData) && rawData[0]) {
      const primeiro = rawData[0]
      if (primeiro.data && primeiro.data.transactions) {
        transacoes = primeiro.data.transactions
      }
    }
    
    return transacoes.map(t => ({
      id: t.id,
      cliente: t.user?.name || '-',
      valorBruto: t.amount,
      valorLiquido: t.net_amount,
      comissao: t.commission_amount,
      status: t.status,
      dataCriacao: t.created_at,
      dataPagamento: t.updated_at,
      transactionId: t.depix_transaction_id
    }))
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return []
  }
}

// Verificar transação específica
export async function verificarTransacao(idTransacao, apiKey = '') {
  try {
    const response = await fetch(CONFIG.WEBHOOKS.verificarTransacao, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id_transacao: idTransacao,
        api_key: apiKey 
      })
    })
    
    const rawData = await response.json()
    
    let data = rawData
    if (Array.isArray(rawData) && rawData[0]) {
      data = rawData[0]
      if (data.data) data = data.data
    }
    
    return {
      success: true,
      id: data.id,
      status: data.status,
      valor: data.amount,
      cliente: data.user?.name || '-'
    }
  } catch (error) {
    console.error('Erro ao verificar transação:', error)
    return { success: false, error: error.message }
  }
}

// Traduzir status da API
export function traduzirStatus(status) {
  if (!status) return { text: '-', type: 'default' }
  
  const statusLower = status.toLowerCase()
  
  if (['paid', 'approved', 'confirmed'].includes(statusLower)) {
    return { text: 'PAGO', type: 'success' }
  }
  if (['pending', 'waiting'].includes(statusLower)) {
    return { text: 'PENDENTE', type: 'warning' }
  }
  if (['expired', 'cancelled', 'canceled'].includes(statusLower)) {
    return { text: 'EXPIRADO', type: 'danger' }
  }
  
  return { text: status.toUpperCase(), type: 'default' }
}
