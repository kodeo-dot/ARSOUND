import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function createClient() {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[ARSOUND] Missing Supabase environment variables");
      throw new Error("Supabase configuration is missing");
    }

    client = _createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "x-application-name": "arsound",
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    });
  }

  return client;
}

// ⬅️ Esto repara Vercel
export { createClient as createBrowserClient };
