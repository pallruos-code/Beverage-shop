// supabase.js
const SUPABASE_URL = 'https://lpwljgptpvtwgdsizvbg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8gMezicicJYtIZk-dS27KQ_tDm_Co7z';

export function getSupabase() {
    if (window.supabaseClientInstance) {
        return window.supabaseClientInstance;
    }
    if (window.supabase) {
        window.supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return window.supabaseClientInstance;
    }
    return null;
}
