-- =====================================================
-- DADOS DE DESENVOLVIMENTO - H2 DATABASE
-- =====================================================
-- Este arquivo cria um usuário de fallback (ID=1)
-- para evitar erros durante desenvolvimento local
-- =====================================================

-- Insere usuário padrão de desenvolvimento
-- H2 não suporta ON CONFLICT, então usamos MERGE INTO
MERGE INTO usuarios (id, nome, email, senha_hash, criado_em, atualizado_em) 
KEY (email)
VALUES (
    1, 
    'Desenvolvedor Local', 
    'dev@cinesia.local', 
    'FIREBASE_AUTH', 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
);
