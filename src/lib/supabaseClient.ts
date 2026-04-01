import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'ERRO CRÍTICO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas. ' +
    'Certifique-se de que elas estão configuradas no painel da Vercel (Production & Preview) e faça um redeploy.'
  );
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
