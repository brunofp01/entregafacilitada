import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS for updates
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = {
    api: {
        bodyParser: false,
    },
};

const buffer = async (readable) => {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    console.log(`🔔 Webhook received! Signature: ${sig?.substring(0, 10)}... Secret configured: ${!!webhookSecret}`);

    try {
        const rawBody = await buffer(req);
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
        console.error(`❌ Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const inquilinoId = session.client_reference_id || session.metadata.inquilino_id;

        console.log(`🔔 Payment successful! Session: ${session.id}, Inquilino: ${inquilinoId}`);

        if (inquilinoId && supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // Update inquilino status
            const { error } = await supabase
                .from('inquilinos')
                .update({
                    aprovacao_ef: 'aprovado',
                    status_pagamento: 'pago',
                    stripe_subscription_id: session.subscription,
                    stripe_customer_id: session.customer
                })
                .eq('id', inquilinoId);

            if (error) {
                console.error(`❌ Error updating inquilino ${inquilinoId}:`, error.message);
            } else {
                console.log(`✅ Inquilino ${inquilinoId} updated successfully.`);
            }
        } else {
            console.error('❌ Missing Supabase config or Inquilino ID in webhook');
        }
    }

    res.json({ received: true });
}
