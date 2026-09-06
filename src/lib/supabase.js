import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[FHC] Supabase environment variables missing. " +
    "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file " +
    "(see .env.example). Auth features will not work until configured."
  );
} else if (supabaseUrl.includes("placeholder")) {
  console.warn(
    "[FHC] Supabase URL appears to be a placeholder. " +
    "Replace it with your real project URL from Supabase Dashboard → Settings → API."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const PROFILE_TABLE = "profiles";