import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const {
        nome, email, cpf, rg, telefone, imobiliaria_id,
        imovel_data, contract_data
    } = req.body;

    if (!email || !nome) {
        return res.status(400).json({ error: 'Nome e E-mail são obrigatórios' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 0. Ensure imobiliaria_id exists (find first admin if null)
        let finalImobiliariaId = imobiliaria_id;
        if (!finalImobiliariaId) {
            const { data: adminData } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
            finalImobiliariaId = adminData?.id;
            if (!finalImobiliariaId) {
                const { data: imobData } = await supabase.from('profiles').select('id').eq('role', 'imobiliaria').limit(1).single();
                finalImobiliariaId = imobData?.id;
            }
        }

        if (!finalImobiliariaId) {
            throw new Error("Nenhuma imobiliária master encontrada para processar a venda.");
        }

        // 1. Check if user already exists in Auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const existingAuthUser = users?.find(u => u.email === email);
        
        let userId = existingAuthUser?.id;
        let isNewUser = !userId;
        let passwordToSend = '******** (sua senha atual)';

        if (!userId) {
            // Generate a secure random password for new users
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-2) + '!';
            passwordToSend = randomPassword;

            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: randomPassword,
                email_confirm: true
            });

            if (authError) throw authError;
            userId = authData?.user?.id;
        }

        // 2. Create/Update Profile
        if (userId) {
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: userId,
                full_name: nome,
                email: email,
                role: 'inquilino',
                imobiliaria_id: finalImobiliariaId
            });
            if (profileError) throw profileError;
        }

        // 3. Create Inquilino Record (Centralized here now)
        if (imovel_data && contract_data) {
            const { error: inquilinoError } = await supabase.from("inquilinos").insert({
                imobiliaria_id: finalImobiliariaId,
                nome: nome,
                email: email,
                cpf: cpf,
                rg: rg,
                telefone: telefone,
                endereco_cep: imovel_data.cep,
                endereco_rua: imovel_data.rua,
                endereco_numero: imovel_data.numero,
                endereco_complemento: imovel_data.complemento,
                endereco_bairro: imovel_data.bairro,
                endereco_cidade: imovel_data.cidade,
                endereco_estado: imovel_data.estado,
                contrato_locacao_url: contract_data.contrato_locacao_url,
                contratos_servico_url: contract_data.contratos_servico_url,
                vistoria_id: contract_data.vistoria_id || null,
                vistoria_upload_url: contract_data.vistoria_upload_url || null,
                autentique_document_id: contract_data.autentique_document_id,
                status_assinatura: 'pendente',
                imovel_area: parseFloat(imovel_data.area) || 0,
                plano_id: contract_data.plano_id,
                plano_nome: contract_data.plano_nome,
                plano_valor_pc: contract_data.plano_valor_pc,
                plano_parcelas: contract_data.plano_parcelas,
                plano_mensalidade: contract_data.plano_mensalidade
            });

            if (inquilinoError) throw inquilinoError;
            console.log(`✅ Registro de inquilino criado para ${email}`);

            // 3.1. Audit Log
            await supabase.from("audit_logs").insert({
                user_id: userId,
                action: "CREATE_SALE",
                entity_type: "inquilino",
                entity_id: email,
                details: { imobiliaria_id: finalImobiliariaId, plano: contract_data.plano_nome }
            });
        }

        // 4. Send Notification (Database)
        if (userId) {
            await supabase.from("notifications").insert({
                user_id: userId,
                title: "Bem-vindo à Entrega Facilitada! 🚀",
                message: "Seu plano foi contratado com sucesso. Assine o contrato enviado ao seu e-mail para ativar a cobertura.",
                type: "success",
                link: "/inquilino/contrato"
            });
        }

        // 5. Send Email
        const firstName = nome.split(' ')[0];
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
                    body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #1e293b; background-color: #0f172a; margin: 0; padding: 0; }
                    .wrapper { background-color: #0f172a; padding: 40px 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
                    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 48px 32px; text-align: center; }
                    .content { padding: 48px; }
                    .footer { padding: 32px; text-align: center; color: #94a3b8; font-size: 12px; background: #f8fafc; border-top: 1px solid #f1f5f9; }
                    h1 { color: #1e293b; font-size: 28px; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.025em; }
                    p { color: #475569; font-size: 16px; margin-bottom: 20px; }
                    .credentials-box { background: #f8fafc; padding: 32px; border-radius: 16px; margin: 32px 0; border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                    .credentials-box::before { content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #ff7e1d; }
                    .cred-item { margin-bottom: 12px; }
                    .cred-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
                    .cred-value { font-size: 18px; font-weight: 700; color: #1e293b; font-family: 'JetBrains Mono', monospace; }
                    .button { display: inline-block; background: #ff7e1d; color: #ffffff !important; padding: 18px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(255, 126, 29, 0.3); }
                    .accent { color: #ff7e1d; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <h2 style="color: white; margin: 0; font-weight: 800; font-size: 24px; letter-spacing: -0.05em;">ENTREGA <span style="color: #ff7e1d;">FACILITADA</span></h2>
                        </div>
                        <div class="content">
                            <h1>Olá, ${firstName}! 👋</h1>
                            <p>É um prazer ter você conosco. Seu perfil na plataforma <span class="accent font-bold">Entrega Facilitada</span> foi ativado pela sua imobiliária.</p>
                            <p>A partir de agora, você tem a segurança de um encerramento de contrato sem burocracia e com total transparência.</p>
                            
                            <div class="credentials-box">
                                <div class="cred-item">
                                    <span class="cred-label">Seu E-mail de Acesso</span>
                                    <span class="cred-value">${email}</span>
                                </div>
                                <div class="cred-item" style="margin-bottom: 0;">
                                    <span class="cred-label">Sua Senha de Acesso</span>
                                    <span class="cred-value">${passwordToSend}</span>
                                </div>
                            </div>

                            <p style="font-size: 13px; color: #64748b; font-style: italic;">* Caso já possua conta, sua senha permanece a mesma.</p>
                            
                            <div style="text-align: center; margin-top: 40px;">
                                <a href="https://entregafacilitada.vercel.app/auth" class="button">Acessar Meu Painel</a>
                            </div>
                        </div>
                        <div class="footer">
                            Este é um e-mail automático. Por favor, não responda.<br>
                            © ${new Date().getFullYear()} Entrega Facilitada • Tecnologia para Imobiliárias.
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_APP_PASS;

        if (gmailUser && gmailPass) {
            try {
                const { default: nodemailer } = await import('nodemailer');
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: gmailUser, pass: gmailPass },
                });

                await transporter.sendMail({
                    from: `"Entrega Facilitada" <${gmailUser}>`,
                    to: email,
                    subject: `🚀 Bem-vindo à Entrega Facilitada, ${firstName}!`,
                    html: emailHtml,
                });
            } catch (emailError) {
                console.error('Email error:', emailError.message);
            }
        }

        return res.status(200).json({ success: true, user_id: userId });
    } catch (error) {
        console.error('Erro ao processar venda:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
