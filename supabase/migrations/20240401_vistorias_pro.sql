-- Atualização da tabela de vistorias e criação das tabelas auxiliares para o novo módulo profissional

-- 1. Melhorar a tabela de vistorias existente
ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS imovel_endereco TEXT;
ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (tipo IN ('entrada', 'saida')) DEFAULT 'entrada';
ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS medidores JSONB DEFAULT '{"agua": {"leitura": "", "foto": ""}, "luz": {"leitura": "", "foto": ""}, "gas": {"leitura": "", "foto": ""}}'::jsonb;
ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS data_fim TIMESTAMP WITH TIME ZONE;

-- 2. Criar tabela de Ambientes (Cômodos)
CREATE TABLE IF NOT EXISTS vistoria_ambientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vistoria_id UUID REFERENCES vistorias(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  ordem INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de Itens do Ambiente
CREATE TABLE IF NOT EXISTS vistoria_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ambiente_id UUID REFERENCES vistoria_ambientes(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  estado TEXT CHECK (estado IN ('Novo', 'Bom', 'Regular', 'Ruim')) DEFAULT 'Bom',
  observacao TEXT,
  fotos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE vistoria_ambientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vistoria_itens ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (Assumindo que a política de 'vistorias' já protege o acesso base)
CREATE POLICY "Imobiliarias can manage their own ambientes" ON vistoria_ambientes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM vistorias v
    WHERE v.id = vistoria_id
    AND v.imobiliaria_id = (SELECT COALESCE(p.imobiliaria_id, p.id) FROM profiles p WHERE p.id = auth.uid())
  )
);

CREATE POLICY "Imobiliarias can manage their own itens" ON vistoria_itens
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM vistoria_ambientes a
    JOIN vistorias v ON v.id = a.vistoria_id
    WHERE a.id = ambiente_id
    AND v.imobiliaria_id = (SELECT COALESCE(p.imobiliaria_id, p.id) FROM profiles p WHERE p.id = auth.uid())
  )
);
