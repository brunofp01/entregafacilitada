import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { path, bucket = 'vistorias' } = req.body;

    if (!path) {
        return res.status(400).json({ error: 'Missing path' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUploadUrl(path);

        if (error) throw error;

        return res.status(200).json({
            signedUrl: data.signedUrl,
            token: data.token,
            path: data.path
        });
    } catch (error) {
        console.error('Error generating signed URL:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
