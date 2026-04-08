import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { firstName, email, tempPassword } = req.body;

    if (!email || !firstName || !tempPassword) {
        return res.status(400).json({ error: 'Dados insuficientes para envio de e-mail.' });
    }

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
                .wrapper { background-color: #f8fafc; padding: 40px 20px; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                .header { background: #142542; padding: 32px; text-align: center; }
                .content { padding: 40px; }
                .footer { padding: 32px; text-align: center; color: #64748b; font-size: 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
                h1 { color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 24px; text-align: left; }
                p { margin-bottom: 16px; font-size: 16px; color: #475569; }
                .credentials-box { background: #f1f5f9; padding: 24px; border-radius: 12px; margin: 32px 0; border: 1px solid #e2e8f0; }
                .cred-item { margin: 8px 0; font-size: 15px; }
                .cred-label { font-weight: 700; color: #64748b; margin-right: 8px; }
                .cred-value { font-weight: 700; color: #1e293b; font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; }
                .button-container { text-align: center; margin-top: 32px; }
                .button { display: inline-block; background: #ff7e1d; color: #ffffff !important; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; transition: background 0.2s; }
                .alert-box { background: #fffbeb; border: 1px solid #fef3c7; padding: 16px; border-radius: 8px; margin-top: 24px; font-size: 13px; color: #92400e; display: flex; align-items: flex-start; }
                .highlight { color: #ff7e1d; font-weight: 700; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="header">
                        <img src="https://entregafacilitada.vercel.app/logo.png" alt="Entrega Facilitada" style="height: 36px;">
                    </div>
                    <div class="content">
                        <h1>Olá, ${firstName}!</h1>
                        <p>Boas-vindas à <span class="highlight">Entrega Facilitada</span>.</p>
                        <p>O seu perfil de usuário foi criado com sucesso em nossa plataforma. A partir de agora, você já pode acessar o sistema para gerenciar suas atividades e informações.</p>
                        
                        <div class="credentials-box">
                            <p style="margin-top: 0; font-weight: 800; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">🔐 SEUS DADOS DE ACESSO:</p>
                            <div class="cred-item"><span class="cred-label">E-mail:</span> <span class="cred-value">${email}</span></div>
                            <div class="cred-item"><span class="cred-label">Senha Temporária:</span> <span class="cred-value">${tempPassword}</span></div>
                        </div>

                        <div class="alert-box">
                            <span>⚠️ <strong>Dica de Segurança:</strong> Por questões de segurança, recomendamos que você altere sua senha logo no primeiro login através da página "Meu Perfil".</span>
                        </div>
                        
                        <div class="button-container">
                            <a href="https://entregafacilitada.vercel.app/auth" class="button">Acessar a Plataforma</a>
                        </div>

                        <p style="margin-top: 40px; font-size: 15px;">Se você tiver qualquer dúvida ou dificuldade no primeiro acesso, nossa equipe está à disposição.</p>
                        <p style="margin-bottom: 0;">Um abraço,<br><strong>Equipe Entrega Facilitada</strong></p>
                    </div>
                    <div class="footer">
                        © ${new Date().getFullYear()} Entrega Facilitada. Todos os direitos reservados.
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
                subject: `Seu acesso à plataforma Entrega Facilitada foi criado 🚀`,
                html: emailHtml,
                text: `Olá ${firstName}, seu acesso à Entrega Facilitada foi criado. E-mail: ${email} | Senha: ${tempPassword}. Acesse em: https://entregafacilitada.vercel.app/auth`,
            });

            return res.status(200).json({ success: true, message: 'E-mail enviado com sucesso.' });
        } catch (emailError) {
            console.error('[NODEMAILER ERROR]', emailError.message);
            return res.status(500).json({ error: 'Erro ao enviar e-mail via servidor.' });
        }
    } else {
        console.error('[AUTH ERROR] Configurações de e-mail (GMAIL_USER/PASS) ausentes.');
        return res.status(500).json({ error: 'Servidor de e-mail não configurado.' });
    }
}
