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

const buffer = async (req) => {
    const chunks = [];
    return new Promise((resolve, reject) => {
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', (err) => reject(err));
    });
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    let rawBody;

    try {
        rawBody = await buffer(req);
        console.log(`🔔 Webhook received! Body size: ${rawBody.length} bytes. Signature header: ${!!sig}`);

        if (process.env.SKIP_STRIPE_SIG_VERIFY === 'true') {
            console.warn('⚠️ WARNING: Skipping Stripe signature verification (SKIP_STRIPE_SIG_VERIFY is true)');
            event = JSON.parse(rawBody.toString());
        } else {
            event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        }
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        // If we have a raw body but signature failed, it might be the secret.
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the events
    const relevantEvents = ['checkout.session.completed', 'invoice.paid', 'invoice.payment_succeeded'];

    if (relevantEvents.includes(event.type)) {
        const sessionOrInvoice = event.data.object;

        // Inquilino ID can be in client_reference_id (Session) or in metadata (Session/Invoice)
        // Note: For subscriptions, metadata needs to be explicitly passed to the subscription
        let inquilinoId = sessionOrInvoice.client_reference_id ||
            (sessionOrInvoice.metadata && sessionOrInvoice.metadata.inquilino_id);

        // If it's an invoice, we might need to find the inquilino by email if metadata is missing
        const customerEmail = sessionOrInvoice.customer_email || sessionOrInvoice.billing_details?.email;

        console.log(`🔔 Event ${event.type} received. InquilinoID: ${inquilinoId}, Email: ${customerEmail}`);

        if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            let query = supabase.from('inquilinos').update({
                status_pagamento: 'pago',
                aprovacao_ef: 'aprovado'
            });

            if (inquilinoId) {
                query = query.eq('id', inquilinoId);
            } else if (customerEmail) {
                query = query.eq('email', customerEmail);
            } else {
                console.error('❌ Could not identify inquilino by ID or Email');
                return res.json({ received: true, error: 'identity_missing' });
            }

            const { error } = await query;

            if (error) {
                console.error(`❌ Error updating inquilino:`, error.message);
            } else {
                console.log(`✅ Inquilino updated successfully via ${event.type}.`);
            }
        }
    }

    res.json({ received: true });
}
