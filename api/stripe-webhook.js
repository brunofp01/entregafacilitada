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
    const sessionOrInvoice = event.data.object;
    let inquilinoId = sessionOrInvoice.client_reference_id ||
        (sessionOrInvoice.metadata && sessionOrInvoice.metadata.inquilino_id) ||
        (sessionOrInvoice.subscription_details?.metadata?.inquilino_id);

    // Se ainda não temos o ID e existe uma assinatura, buscamos nos metadados da assinatura
    if (!inquilinoId && sessionOrInvoice.subscription && typeof sessionOrInvoice.subscription === 'string') {
        try {
            const subscription = await stripe.subscriptions.retrieve(sessionOrInvoice.subscription);
            inquilinoId = subscription.metadata?.inquilino_id;
        } catch (err) {
            console.error('⚠️ Could not retrieve subscription metadata:', err.message);
        }
    }

    const customerEmail = sessionOrInvoice.customer_email || sessionOrInvoice.billing_details?.email;
    console.log(`🔔 Event ${event.type} received. InquilinoID: ${inquilinoId}, Email: ${customerEmail}`);

    if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        switch (event.type) {
            case 'checkout.session.completed':
            case 'invoice.paid':
            case 'invoice.payment_succeeded': {
                let query = supabase.from('inquilinos').update({
                    status_pagamento: 'pago',
                    aprovacao_ef: 'aprovado'
                });

                if (inquilinoId) {
                    query = query.eq('id', inquilinoId);
                } else if (customerEmail) {
                    query = query.eq('email', customerEmail);
                } else {
                    console.error('❌ Could not identify inquilino for success event');
                    return res.json({ received: true, error: 'identity_missing' });
                }

                const { error } = await query;
                if (error) console.error(`❌ Error updating inquilino (success):`, error.message);
                else console.log(`✅ Inquilino marked as PAID via ${event.type}.`);

                // Fix Subscription Term (cancel_at) on first checkout
                if (event.type === 'checkout.session.completed' && sessionOrInvoice.mode === 'subscription' && sessionOrInvoice.subscription) {
                    try {
                        const months = Number(sessionOrInvoice.metadata?.plano_parcelas) || 12;
                        const endDate = new Date();
                        endDate.setMonth(endDate.getMonth() + months);
                        const cancelAtSeconds = Math.floor(endDate.getTime() / 1000);
                        await stripe.subscriptions.update(sessionOrInvoice.subscription, { cancel_at: cancelAtSeconds });
                        console.log(`📅 Subscription ${sessionOrInvoice.subscription} set to cancel in ${months} months.`);
                    } catch (subErr) {
                        console.error(`❌ Error updating subscription term:`, subErr.message);
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                let query = supabase.from('inquilinos').update({ status_pagamento: 'vencido' });
                if (inquilinoId) query = query.eq('id', inquilinoId);
                else if (customerEmail) query = query.eq('email', customerEmail);
                else break;

                const { error } = await query;
                if (error) console.error(`❌ Error updating inquilino (fail):`, error.message);
                else console.log(`⚠️ Inquilino marked as OVERDUE (payment failed).`);
                break;
            }

            case 'customer.subscription.deleted': {
                let query = supabase.from('inquilinos').update({
                    status_pagamento: 'cancelado',
                    // Opcional: tirar a aprovação se quiser que eles tenham que passar por nova análise
                    // aprovacao_ef: 'pendente' 
                });
                if (inquilinoId) query = query.eq('id', inquilinoId);
                else if (customerEmail) query = query.eq('email', customerEmail);
                else break;

                const { error } = await query;
                if (error) console.error(`❌ Error updating inquilino (deleted):`, error.message);
                else console.log(`🚫 Inquilino marked as CANCELLED (subscription deleted).`);
                break;
            }

            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }
    }

    res.json({ received: true });
}
