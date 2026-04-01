import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'AVISO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas no ambiente atual. ' +
    'Se você estiver na Vercel, verifique se as variáveis de ambiente estão marcadas para "Production" e "Preview".'
  );
}

// Fallback to placeholder only to avoid top-level crash, but real calls will fail until configured
export const supabase = createClient(
  supabaseUrl || 'https://dfwyyfsypgnxxgfqgswg.supabase.co', 
  supabaseAnonKey || 'missing-key'
);
