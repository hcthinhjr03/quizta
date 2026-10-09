import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

let client;
export function getSupabase() {
  client ??= createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
