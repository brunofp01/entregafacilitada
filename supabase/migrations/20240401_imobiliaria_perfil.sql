-- Tabela para Armazenamento do Perfil da Imobiliária (Cabeçalho do Laudo)
CREATE TABLE IF NOT EXISTS imobiliaria_perfil (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imobiliaria_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nome_fantasia TEXT NOT NULL,
  cnpj TEXT,
  endereco_completo TEXT,
  whatsapp TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(imobiliaria_id)
);

-- Habilitar RLS
ALTER TABLE imobiliaria_perfil ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Owners can manage their own perfil" ON imobiliaria_perfil
FOR ALL TO authenticated
USING (auth.uid() = imobiliaria_id)
WITH CHECK (auth.uid() = imobiliaria_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_imobiliaria_perfil_updated_at
    BEFORE UPDATE ON imobiliaria_perfil
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
