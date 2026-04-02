import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkUser() {
  const { data, error } = await supabase.auth.signInWithPassword({ email: 'fake123@imobiliaria.com', password: 'password123' });
  if (error) { console.log('Login failed: ', error.message); }
  
  if (!data?.user) {
     const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'fake123@imobiliaria.com',
        password: 'password123',
        options: { data: { full_name: 'Fake User', whatsapp: '1199999999', role: 'imobiliaria', imobiliaria_id: 'test-org-id' } }
     });
     console.log('Signup:', signUpError ? signUpError.message : signUpData.user.id);
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session exists:', !!session);

  const { data: profile } = await supabase.from('profiles').select('*').single();
  console.log('Profile:', profile);
}
checkUser();
