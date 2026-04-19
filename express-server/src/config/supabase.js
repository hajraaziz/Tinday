import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "KEY PREVIEW:",
  process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 30),
);

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
