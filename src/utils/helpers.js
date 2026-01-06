// Formatar valor em moeda BRL
export function formatMoney(value) {
  const num = parseFloat(value) || 0
  return num.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  })
}

// Formatar data (DD/MM/YYYY)
export function formatDate(dateStr) {
  if (!dateStr) return '-'
  
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

// Formatar data e hora
export function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('pt-BR')
  } catch {
    return dateStr
  }
}

// Verificar status de vencimento
export function getStatusVencimento(dataVencimento) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const vencimento = new Date(dataVencimento + 'T00:00:00')
  const diffDays = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { text: 'Vencido', type: 'danger' }
  if (diffDays <= 5) return { text: 'Vence em breve', type: 'warning' }
  return { text: 'Ativo', type: 'success' }
}

// Gerar senha aleatória
export function gerarSenhaAleatoria(tamanho = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let senha = ''
  for (let i = 0; i < tamanho; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

// Copiar texto para clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Erro ao copiar:', error)
    return false
  }
}

// Download arquivo base64
export function downloadBase64File(base64Data, fileName) {
  try {
    // Criar link temporário
    const link = document.createElement('a')
    link.href = base64Data
    link.download = fileName || 'arquivo'
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return true
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error)
    return false
  }
}

// Calcular novo vencimento (adicionar meses)
export function calcularNovoVencimento(dataAtual, meses = 1) {
  const data = new Date(dataAtual + 'T00:00:00')
  data.setMonth(data.getMonth() + meses)
  return data.toISOString().split('T')[0]
}

// Gerar meses para filtro
export function gerarMesesFiltro(quantidade = 6) {
  const hoje = new Date()
  const meses = []
  
  for (let i = 0; i < quantidade; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const valor = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
    const label = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    meses.push({ 
      value: valor, 
      label: label.charAt(0).toUpperCase() + label.slice(1) 
    })
  }
  
  return meses
}
