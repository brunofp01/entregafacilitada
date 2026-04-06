import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { nome, email, cpf, rg, telefone, imobiliaria_id, plano_id, plano_nome, plano_mensalidade, plano_parcelas } = req.body;

    if (!email || !nome) {
        return res.status(400).json({ error: 'Nome e E-mail são obrigatórios' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: '123456',
            email_confirm: true
        });

        if (authError) {
            // If user already exists, we might just update their profile/inquilino
            if (authError.message.includes('already registered')) {
                console.log('User already exists, proceeding with update...');
            } else {
                throw authError;
            }
        }

        const userId = authData?.user?.id;

        // 2. Create/Update Profile
        if (userId) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: nome,
                    email: email,
                    role: 'inquilino',
                    imobiliaria_id: imobiliaria_id || null
                });

            if (profileError) throw profileError;
        }

        // 3. (REMOVED: Inquilino record creation will be handled by the frontend)

        // 4. "Send" Personalized Email (Mocked)
        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #333;">Olá, ${nome.split(' ')[0]}!</h2>
                <p>Boas-vindas à <strong>Entrega Facilitada</strong>!</p>
                <p>Uma nova venda foi gerada para você. Agora seu imóvel está a um passo da proteção total.</p>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Seu Acesso:</strong></p>
                    <p style="margin: 5px 0;">URL: <a href="https://entregafacilitada.vercel.app">entregafacilitada.vercel.app</a></p>
                    <p style="margin: 5px 0;">Usuário: ${email}</p>
                    <p style="margin: 5px 0;">Senha Padrão: <strong>123456</strong></p>
                </div>
                
                <p>Por favor, acesse sua conta e assine seu contrato para ativar sua garantia.</p>
                <p style="font-size: 12px; color: #888;">Este é um e-mail automático, não responda.</p>
            </div>
        `;

        console.log('--- ENVIANDO E-MAIL PERSONALIZADO ---');
        console.log(`Para: ${email}`);
        console.log(`Assunto: Bem-vindo à Entrega Facilitada - Sua venda foi gerada!`);
        console.log('Conteúdo:', emailHtml);
        console.log('--------------------------------------');

        return res.status(200).json({ success: true, user_id: userId });
    } catch (error) {
        console.error('Erro ao criar usuário:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
