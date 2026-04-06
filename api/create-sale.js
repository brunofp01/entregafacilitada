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
                        <p>Sua contratação foi realizada com sucesso através da sua imobiliária. Agora você conta com a proteção líder em devolução de chaves.</p>
                        
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
                                    <span class="step-label">ETAPA 3</span>
                                    <span class="step-title">Solicite a desocupação</span>
                                    <span class="step-desc">Ao final do contrato, acione o app e agende a vistoria de saída de forma 100% digital.</span>
                                </div>
                            </div>

                            <p style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; margin: 10px 0 25px 60px; letter-spacing: 1px;">DAQUI EM DIANTE É COM A ENTREGA FACILITADA "</p>

                            <div class="step">
                                <div class="step-icon" style="background: #f59e0b; color: white; border-color: #f59e0b;">📋</div>
                                <div class="step-text">
                                    <span class="step-label">ETAPA 4</span>
                                    <span class="step-title">Vistoria e diagnóstico</span>
                                    <span class="step-desc">Nossa equipe realiza a vistoria, documenta o estado do imóvel e gera o orçamento dos reparos cobertos.</span>
                                </div>
                            </div>

                            <div class="step">
                                <div class="step-icon" style="background: #f59e0b; color: white; border-color: #f59e0b;">🔨</div>
                                <div class="step-text">
                                    <span class="step-label">ETAPA 5</span>
                                    <span class="step-title">Execução dos reparos</span>
                                    <span class="step-desc">Profissionais credenciados cuidam de pintura, limpeza e reparos — tudo dentro do pacote contratado.</span>
                                </div>
                            </div>

                            <div class="step">
                                <div class="step-icon" style="background: #f59e0b; color: white; border-color: #f59e0b;">🔑</div>
                                <div class="step-text">
                                    <span class="step-label">ETAPA 6</span>
                                    <span class="step-title">Chaves entregues, Nada Consta emitido</span>
                                    <span class="step-desc">Certificado automático de quitação. Entregue as chaves sem estresse e sem cobranças extras.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            try {
                const { Resend } = await import('resend');
                const resend = new Resend(resendApiKey);
                await resend.emails.send({
                    from: 'Entrega Facilitada <onboarding@resend.dev>', // IMPORTANTE: Para enviar para qualquer e-mail, valide seu domínio no Resend!
                    to: [email],
                    subject: `Bem-vindo à Entrega Facilitada, ${firstName}!`,
                    html: emailHtml
                });
                console.log(`[RESEND] E-mail enviado com sucesso para ${email}`);
            } catch (emailError) {
                console.error('[RESEND ERROR] Falha ao enviar e-mail:', emailError.message);
                console.log('--- DICA: Verifique se o domínio foi validado no painel do Resend ---');
            }
        } else {
            console.warn('[RESEND WARNING] RESEND_API_KEY não encontrada. E-mail não será enviado.');
        }

        return res.status(200).json({ success: true, user_id: userId });
    } catch (error) {
        console.error('Erro ao criar usuário:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
