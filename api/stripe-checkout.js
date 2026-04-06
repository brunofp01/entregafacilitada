import Stripe from 'stripe';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { plan_name, price_amount, customer_email, inquilino_id, plano_parcelas } = req.body;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
        return res.status(500).json({ error: 'Stripe Secret Key is not configured in Vercel' });
    }

    if (!plan_name || !price_amount || !customer_email || !inquilino_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16', // or latest
        });

        // Converte valor BRL para centavos (Stripe aceita apenas inteiros em centavos)
        const unit_amount = Math.round(Number(price_amount) * 100);

        // Calcula data de encerramento da assinatura
        const months = Number(plano_parcelas) || 12;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);
        const cancelAtSeconds = Math.floor(endDate.getTime() / 1000);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'boleto'],
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: `Garantia Entrega Facilitada: ${plan_name}`,
                            description: `Pagamento de mensalidade (${months} parcelas) - ID: ${inquilino_id.split('-')[0]}`,
                        },
                        unit_amount,
                        // Configurando para recorrência mensal (mensalidade)
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            customer_email: customer_email,
            client_reference_id: inquilino_id,
            subscription_data: {
                cancel_at: cancelAtSeconds,
                metadata: {
                    inquilino_id: inquilino_id,
                    plan_name: plan_name
                }
            },
            success_url: `https://entregafacilitada.vercel.app/inquilino/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://entregafacilitada.vercel.app/inquilino/pagamentos?canceled=true`,
            metadata: {
                inquilino_id: inquilino_id,
                plan_name: plan_name
            }
        });

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
