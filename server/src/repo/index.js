import { useSupabase } from "../config.js";
import { createLocalRepo } from "./local.js";
import { createSupabaseRepo } from "./supabase.js";

export const repo = useSupabase ? createSupabaseRepo() : createLocalRepo();
