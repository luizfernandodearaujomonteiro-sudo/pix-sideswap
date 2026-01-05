-- ========================================
-- TABELA: solicitacoes_pagamento
-- Armazena solicitações de pagamento de contas dos revendedores
-- ========================================

CREATE TABLE IF NOT EXISTS solicitacoes_pagamento (
    id BIGSERIAL PRIMARY KEY,
    associado_id BIGINT NOT NULL,
    nome_solicitante VARCHAR(255),
    valor_original DECIMAL(10,2) NOT NULL,
    valor_com_taxa DECIMAL(10,2) NOT NULL,
    codigo_barras TEXT,
    fatura_base64 TEXT,
    fatura_nome VARCHAR(255),
    transaction_id_revendedor VARCHAR(500),
    observacoes_revendedor TEXT,
    status VARCHAR(50) DEFAULT 'pendente',
    observacoes_admin TEXT,
    comprovante_base64 TEXT,
    comprovante_nome VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pagamento_associado ON solicitacoes_pagamento(associado_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pagamento_status ON solicitacoes_pagamento(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pagamento_created ON solicitacoes_pagamento(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE solicitacoes_pagamento ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode inserir
CREATE POLICY "Permitir inserção para todos" 
ON solicitacoes_pagamento FOR INSERT 
WITH CHECK (true);

-- Política: Qualquer um pode ler (admin filtra por tudo, revendedor por associado_id no frontend)
CREATE POLICY "Permitir leitura para todos" 
ON solicitacoes_pagamento FOR SELECT 
USING (true);

-- Política: Qualquer um pode atualizar (controle feito no frontend)
CREATE POLICY "Permitir atualização para todos" 
ON solicitacoes_pagamento FOR UPDATE 
USING (true);

-- ========================================
-- COMENTÁRIOS DA TABELA
-- ========================================
COMMENT ON TABLE solicitacoes_pagamento IS 'Solicitações de pagamento de contas dos revendedores';
COMMENT ON COLUMN solicitacoes_pagamento.associado_id IS 'ID do revendedor que solicitou';
COMMENT ON COLUMN solicitacoes_pagamento.nome_solicitante IS 'Nome do revendedor';
COMMENT ON COLUMN solicitacoes_pagamento.valor_original IS 'Valor da conta a ser paga';
COMMENT ON COLUMN solicitacoes_pagamento.valor_com_taxa IS 'Valor com taxa de 3%';
COMMENT ON COLUMN solicitacoes_pagamento.codigo_barras IS 'Código de barras do boleto';
COMMENT ON COLUMN solicitacoes_pagamento.fatura_base64 IS 'Arquivo da fatura em base64';
COMMENT ON COLUMN solicitacoes_pagamento.fatura_nome IS 'Nome do arquivo da fatura';
COMMENT ON COLUMN solicitacoes_pagamento.transaction_id_revendedor IS 'TX ID do PIX enviado pelo revendedor';
COMMENT ON COLUMN solicitacoes_pagamento.observacoes_revendedor IS 'Observações do revendedor (nome destinatário, etc)';
COMMENT ON COLUMN solicitacoes_pagamento.status IS 'Status: pendente, em_processamento, pago, cancelado';
COMMENT ON COLUMN solicitacoes_pagamento.observacoes_admin IS 'Observações do admin';
COMMENT ON COLUMN solicitacoes_pagamento.comprovante_base64 IS 'Comprovante de pagamento em base64';
COMMENT ON COLUMN solicitacoes_pagamento.comprovante_nome IS 'Nome do arquivo do comprovante';
