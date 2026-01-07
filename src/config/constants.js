// Configurações do sistema
export const CONFIG = {
  SUPABASE_URL: 'https://bqbmvurwmsgitundbdxt.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYm12dXJ3bXNnaXR1bmRiZHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA4NzU5OTUsImV4cCI6MjAzNjQ1MTk5NX0.Mr9GtJJuCHgyXsrfCKrrVMQ7LebD3HXAgi0Rs94u5kw',
  
  WEBHOOKS: {
    gerarPix: 'https://n8n.ftcplay.com/webhook/gerar-pix',
    verificarPagamento: 'https://n8n.ftcplay.com/webhook/verificar-pagamento-pix',
    verificarTransacao: 'https://n8n.ftcplay.com/webhook/verificar_id_transacao'
  },
  
  URL_PAINEL_CLIENTE: 'http://geradordepix.ftcplay.com'
}

// Roles do sistema
export const ROLES = {
  ADMIN: 'admin',
  REVENDEDOR: 'revendedor'
}
