import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    try {
        // Usar service role key para criar o usuário sem deslogar o admin
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // 1. Criar o usuário no Auth do Supabase
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Confirmar email automaticamente
            user_metadata: {
                full_name: nome,
                role: 'imobiliaria'
            }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                return res.status(409).json({ error: 'Este e-mail já está cadastrado no sistema.' });
            }
            throw authError;
        }

        const newUserId = authData.user.id;

        // 2. Atualizar o perfil criado pela trigger com nome e role corretos
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: newUserId,
                email: email,
                full_name: nome,
                role: 'imobiliaria',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('Erro ao atualizar perfil:', profileError);
            // Não lançar erro fatal — o usuário foi criado, mas o perfil pode ser corrigido depois
        }

        return res.status(200).json({
            success: true,
            userId: newUserId,
            message: `Imobiliária "${nome}" criada com sucesso.`
        });

    } catch (error) {
        console.error('Erro ao criar imobiliária:', error);
        return res.status(500).json({ error: error.message || 'Erro interno ao criar imobiliária.' });
    }
}
