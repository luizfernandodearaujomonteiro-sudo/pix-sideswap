# Painel Master - React Multi-Tenant

Sistema de gestao de associados/revendedores PIX com arquitetura multi-tenant.
Integra **Painel Admin (Master)** + **Painel Cliente (Revendedor)** em uma unica aplicacao.

## Visao Geral

Este projeto converte os paineis PIX (antes em HTML estatico separado por cliente) para uma aplicacao React moderna com:

- **Login unico** para Admin e Revendedores
- **Dados isolados** por revendedor via `associado_id`
- **Mesmo banco Supabase** (dados historicos preservados)
- **Integracao com webhooks N8N** para PIX

## Instalacao

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Build para producao
npm run build
```

## Sistema de Roles

### Admin (Master)
| Pagina | Descricao |
|--------|-----------|
| Dashboard | Stats gerais, ultimos associados |
| Associados | CRUD completo, gerar credenciais |
| Minhas Vendas | Todas vendas via API |
| Comissoes | 1% das vendas dos revendedores |
| Resumo Revendedores | Vendas por mes/revendedor |
| Renovacoes | Aprovar renovacoes pendentes |
| Planos | CRUD de planos |
| Forma de Pagamento | Configurar PIX |
| Configuracoes | Chave API |
| Perfil | Alterar senha |

### Revendedor (Cliente)
| Pagina | Descricao |
|--------|-----------|
| Gerar PIX | Criar QR Code para recebimento |
| Minhas Vendas | Historico com stats e paginacao |
| Verificar Venda | Buscar transacao por ID |
| Logs de Codigos | PIX gerados com filtro de status |
| Meu Plano | Ver plano, vencimento, renovar |
| Configuracoes | Chave API pessoal |
| Perfil | Alterar senha |

## Estrutura de Pastas

```
src/
├── components/
│   ├── Layout/          # Sidebar, Header, Layout
│   └── UI/              # Button, Card, Table, Modal...
├── contexts/
│   └── AuthContext.jsx  # Autenticacao multi-tenant
├── pages/
│   ├── Login.jsx        # Tela de login unica
│   ├── Dashboard.jsx    # Dashboard (admin)
│   ├── Associados.jsx   # CRUD associados (admin)
│   ├── Vendas.jsx       # Historico de vendas
│   ├── GerarPix.jsx     # Gerar QR Code PIX
│   ├── VerificarVenda.jsx # Buscar transacao
│   ├── LogsPix.jsx      # Logs do revendedor
│   ├── MeuPlano.jsx     # Plano do revendedor
│   └── ...
├── services/
│   ├── supabase.js      # Cliente Supabase
│   └── api.js           # Webhooks N8N
├── config/
│   └── constants.js     # Configuracoes
└── styles/
    └── index.css        # Estilos globais (tema dark)
```

## Autenticacao

O sistema verifica credenciais em ordem:

```javascript
// 1. Verificar se e Admin
const configs = await getConfiguracoes()
if (configs.admin_usuario === username && configs.admin_senha === password) {
  // E admin - acessa TUDO
}

// 2. Verificar se e Revendedor
const associado = await getAssociadoByCredentials(username, password)
if (associado) {
  // E revendedor - acessa apenas SEUS dados
}
```

## Tabelas Supabase

| Tabela | Descricao |
|--------|-----------|
| `master_configuracoes` | Configs do admin (login, API key, PIX) |
| `master_planos` | Planos disponiveis |
| `master_associados` | Revendedores/associados |
| `associado_logs_pix` | Vendas dos revendedores (filtrado por associado_id) |
| `renovacoes_pendentes` | Renovacoes pendentes |
| `logs_pix` | Logs gerais de PIX (admin) |

## Webhooks N8N

```javascript
WEBHOOKS: {
  gerarPix: 'https://n8n.ftcplay.com/webhook/gerar-pix',
  verificarPagamento: 'https://n8n.ftcplay.com/webhook/verificar-pagamento-pix',
  verificarTransacao: 'https://n8n.ftcplay.com/webhook/verificar_id_transacao'
}
```

## Isolamento de Dados

```javascript
// Admin - sem filtro, ve TUDO
const { data } = await supabase
  .from('associado_logs_pix')
  .select('*')

// Revendedor - filtro por associado_id
const { data } = await supabase
  .from('associado_logs_pix')
  .select('*')
  .eq('associado_id', user.id)  // So ve os dele
```

## Funcionalidades Implementadas

### Admin
- [x] Dashboard com stats
- [x] CRUD Associados (com geracao de credenciais)
- [x] CRUD Planos
- [x] Historico de Vendas (via API)
- [x] Comissoes (1% automatico)
- [x] Resumo por Revendedor (filtro mensal)
- [x] Renovacoes (aprovar)
- [x] Forma de Pagamento PIX
- [x] Configuracoes API
- [x] Perfil (alterar senha)

### Revendedor
- [x] Gerar PIX (QR Code)
- [x] Minhas Vendas (filtrado)
- [x] Verificar Venda (por ID)
- [x] Logs de Codigos (com filtro status)
- [x] Meu Plano (ver/renovar)
- [x] Configuracoes (API key propria)
- [x] Perfil (alterar senha)

## Design System

- **Tema:** Dark mode
- **Cores:** Verde accent (#10b981), Roxo secundario (#8b5cf6)
- **Fontes:** Plus Jakarta Sans + JetBrains Mono
- **Responsivo:** Mobile-first (breakpoints: 768px, 480px)

---

**Desenvolvido com React 18 + Vite + Supabase + React Router**
