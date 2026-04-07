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

            // Fallback to any imobiliaria if still null
            if (!finalImobiliariaId) {
                const { data: imobData } = await supabase.from('profiles').select('id').eq('role', 'imobiliaria').limit(1).single();
                finalImobiliariaId = imobData?.id;
            }
        }

        if (!finalImobiliariaId) {
            throw new Error("Nenhuma imobiliária master encontrada para processar a venda.");
        }

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: '123456',
            email_confirm: true
        });

        if (authError && !authError.message.includes('already registered')) {
            throw authError;
        }

        const userId = authData?.user?.id;

        // 2. Create/Update Profile
        if (userId) {
            await supabase.from('profiles').upsert({
                id: userId,
                full_name: nome,
                email: email,
                role: 'inquilino',
                imobiliaria_id: finalImobiliariaId
            });
        }

        // 3. Create Inquilino Record (Bypassing RLS via Service Role)
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
                vistoria_upload_url: contract_data.vistoria_upload_url,
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
        }

        // 4. Send Personalized Email via Resend
        const firstName = nome.split(' ')[0];
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                    .header { background: #f8fafc; padding: 30px; text-align: center; border-bottom: 1px solid #e0e0e0; }
                    .content { padding: 30px; background: #ffffff; }
                    .footer { background: #f8fafc; padding: 30px; border-top: 1px solid #e0e0e0; }
                    .welcome-title { color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 16px; }
                    .credentials-box { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #cbd5e1; }
                    .credentials-title { font-weight: 700; color: #475569; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .cred-item { margin: 5px 0; font-size: 15px; }
                    .button { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; margin-top: 20px; text-align: center; }
                    
                    .how-it-works { margin-top: 40px; background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; }
                    .step { display: flex; margin-bottom: 24px; align-items: flex-start; }
                    .step-icon { width: 44px; height: 44px; background: #f8fafc; border-radius: 10px; display: inline-block; text-align: center; line-height: 44px; margin-right: 15px; font-size: 20px; flex-shrink: 0; border: 1px solid #e2e8f0; }
                    .step-text { flex-grow: 1; }
                    .step-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
                    .step-title { font-weight: 800; color: #1e293b; font-size: 16px; display: block; }
                    .step-desc { font-size: 13px; color: #64748b; margin-top: 4px; display: block; }
                    .how-title { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 25px; text-align: center; }
                    .highlight-blue { color: #2563eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://entregafacilitada.vercel.app/logo.png" alt="Entrega Facilitada" style="height: 40px; margin-bottom: 10px;">
                    </div>
                    <div class="content">
                        <h2 class="welcome-title">Olá, ${firstName}!</h2>
                        <p>Boas-vindas à <span class="highlight-blue"><strong>Entrega Facilitada</strong></span>!</p>
                        <p>Sua contratação foi realizada com sucesso através da nossa plataforma. Agora você conta com a proteção líder em devolução de chaves.</p>
                        
                        <div class="credentials-box">
                            <div class="credentials-title">Seus Dados de Acesso:</div>
                            <div class="cred-item"><strong>E-mail:</strong> ${email}</div>
                            <div class="cred-item"><strong>Senha Padrão:</strong> 123456</div>
                            <p style="font-size: 12px; color: #64748b; margin-top: 10px;">* Recomendamos alterar sua senha no primeiro acesso.</p>
                        </div>
                        
                        <center>
                            <a href="https://entregafacilitada.vercel.app/auth" class="button">Acessar Minha Proteção</a>
                        </center>

                        <div class="how-it-works">
                            <h3 class="how-title">Veja como funciona com a <span class="highlight-blue">Entrega Facilitada</span>:</h3>
                            
                            <div class="step">
                                <div class="step-icon" style="background: #1e293b; color: white; border-color: #1e293b;">📅</div>
                                <div class="step-text">
                                    <span class="step-label">ETAPA 1</span>
                                    <span class="step-title">Aguarde o encerramento do seu contrato</span>
                                    <span class="step-desc">Seu plano está ativo e garantirá que sua saída seja tranquila.</span>
                                </div>
                            </div>

                            <div class="step">
                                <div class="step-icon" style="background: #f59e0b; color: white; border-color: #f59e0b;">📋</div>
                                <div class="step-text">
                                    <span class="step-label">ETAPA 2</span>
                                    <span class="step-title">Acione a Entrega Facilitada</span>
                                    <span class="step-desc">30 dias antes de mudar, nos avise pelo app ou WhatsApp.</span>
                                </div>
                            </div>

                            <div class="step">
                                <div class="step-icon" style="background: #f59e0b; color: white; border-color: #f59e0b;">🔨</div>
                                <div class="step-text">
                                    <span class="step-label">ETAPA 3</span>
                                    <span class="step-title">Restauração e Reparos</span>
                                    <span class="step-desc">Assumimos a pintura e adequação total do imóvel conforme o laudo inicial.</span>
                                </div>
                            </div>

                            <div class="step">
                                <div class="step-icon" style="background: #f59e0b; color: white; border-color: #f59e0b;">🔑</div>
                                <div class="step-text">
                                    <span class="step-label">ETAPA 4</span>
                                    <span class="step-title">Chaves entregues com aprovação</span>
                                    <span class="step-desc">Garantimos a vistoria aprovada pela imobiliária. Sem estresse.</span>
                                </div>
                            </div>
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
                    auth: {
                        user: gmailUser,
                        pass: gmailPass,
                    },
                });

                await transporter.sendMail({
                    from: `"Entrega Facilitada" <${gmailUser}>`,
                    to: email,
                    subject: `Contratação Confirmada - Bem-vindo à Entrega Facilitada, ${firstName}!`,
                    html: emailHtml,
                });
            } catch (emailError) {
                console.error('[NODEMAILER ERROR] Falha ao enviar e-mail:', emailError.message);
            }
        }

        return res.status(200).json({ success: true, user_id: userId });
    } catch (error) {
        console.error('Erro ao processar venda:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
