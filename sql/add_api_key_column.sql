-- Adicionar coluna api_key na tabela master_associados (se não existir)
ALTER TABLE master_associados 
ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'master_associados' 
AND column_name = 'api_key';
