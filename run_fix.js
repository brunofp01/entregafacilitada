import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data: b, error: e1 } = await supabase.auth.signInWithPassword({ email: 'bruno@teste.com', password: '123456' });
    console.log('Bruno login:', !!b?.user, e1?.message);
    if (b?.user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', b.user.id).single();
        console.log("Bruno profile:", p);
        await supabase.auth.signOut();
    }
}

run();
