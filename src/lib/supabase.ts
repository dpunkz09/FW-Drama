import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Make Supabase optional - only needed for watch progress tracking
let supabase: ReturnType<typeof createClient> | null = null;

if (url && key && url !== 'your_supabase_url' && key !== 'your_supabase_key') {
  try {
    supabase = createClient(url, key);
    console.log('✅ Supabase: Connected for watch progress tracking');
  } catch (error) {
    console.warn('⚠️ Supabase: Failed to initialize. Watch progress will not be saved.', error);
  }
} else {
  console.warn('⚠️ Supabase: Not configured. Watch progress tracking disabled.');
  console.info('   To enable, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
}

export { supabase };
