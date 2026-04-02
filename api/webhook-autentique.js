import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const payload = req.body;
        console.log('Autentique Webhook Received:', JSON.stringify(payload));

        // O Autentique envia o evento no campo "action" ou "event" dependendo da versão
        const eventType = payload.action || payload.event;
        const documentId = payload.document?.uuid || payload.document?.id;

        if (!documentId) {
            return res.status(400).json({ error: 'Missing document ID in payload' });
        }

        // Se for um evento de assinatura ou conclusão
        if (eventType === 'document.signed' || eventType === 'document.completed' || eventType === 'signed') {
            const { error } = await supabase
                .from('inquilinos')
                .update({ status_assinatura: 'assinado' })
                .eq('autentique_document_id', documentId);

            if (error) {
                console.error('Supabase update error via webhook:', error);
                return res.status(500).json({ error: 'Database update failed' });
            }

            console.log(`Document ${documentId} updated to 'assinado' via webhook.`);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Webhook Error:', err);
        return res.status(500).json({ error: err.message });
    }
}
