import Stripe from 'stripe';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email } = req.body;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
        return res.status(500).json({ error: 'Stripe Secret Key is not configured' });
    }

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const stripe = new Stripe(stripeKey);

        // 1. Find the customer in Stripe by email
        const customers = await stripe.customers.list({
            email: email,
            limit: 1,
        });

        if (customers.data.length === 0) {
            return res.status(404).json({ error: 'Stripe Customer not found' });
        }

        const customerId = customers.data[0].id;

        // 2. Find the latest open invoice for this customer
        const invoices = await stripe.invoices.list({
            customer: customerId,
            status: 'open',
            limit: 5,
        });

        // Also check for past_due invoices
        const pastDueInvoices = await stripe.invoices.list({
            customer: customerId,
            status: 'past_due',
            limit: 1,
        });

        // Combine and pick the most recent one (or just the latest open one)
        let latestInvoice = invoices.data[0] || pastDueInvoices.data[0];

        if (!latestInvoice) {
            // If no open/past_due, maybe return the latest paid one just as history?
            // For now, let's just say no pending invoices.
            return res.status(200).json({
                success: true,
                hasPending: false,
                message: 'No pending invoices found'
            });
        }

        return res.status(200).json({
            success: true,
            hasPending: true,
            status: latestInvoice.status,
            invoiceUrl: latestInvoice.hosted_invoice_url,
            dueDate: latestInvoice.due_date ? new Date(latestInvoice.due_date * 1000).toLocaleDateString('pt-BR') : null,
            amount: latestInvoice.amount_due / 100
        });

    } catch (error) {
        console.error("Error fetching Stripe invoice:", error);
        return res.status(500).json({ error: error.message });
    }
}
