import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_PROJECT_URL) {
  throw new Error('SUPABASE_PROJECT_URL não está definida nas variáveis de ambiente');
}

if (!process.env.SUPABASE_API_KEY) {
  throw new Error('SUPABASE_API_KEY não está definida nas variáveis de ambiente');
}

export const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_API_KEY
); 