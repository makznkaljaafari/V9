
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmuhxplikeohlutvmntf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdWh4cGxpa2VvaGx1dHZtbnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNTIwNDQsImV4cCI6MjA4MjgyODA0NH0.K94qX1Qy8g40CjMkIXFuUkCckGYh-dffN970zFBAiw8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'alshwaia_auth_session',
  },
  global: {
    headers: { 'x-application-name': 'alshwaia-smart-system' },
    // تحسين fetch للتعامل مع بطء الإنترنت وزيادة وقت المهلة (Timeout)
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        // إضافة إشارة إلغاء للطلبات التي تتجاوز 45 ثانية
        signal: AbortSignal.timeout(45000),
      });
    }
  },
  db: {
    schema: 'public'
  }
});
