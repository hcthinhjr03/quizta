import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(serverDir, ".env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const isProd = process.env.NODE_ENV === "production";

export const config = {
  isProd,
  port: Number(process.env.PORT) || 3001,
  // Dev mặc định mật khẩu "admin"; production bắt buộc phải đặt ADMIN_PASSWORD.
  adminPassword: process.env.ADMIN_PASSWORD || (isProd ? "" : "admin"),
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseBucket: process.env.SUPABASE_BUCKET || "media",
  localDataDir: path.join(serverDir, ".local-data"),
  clientDist: path.resolve(serverDir, "../client/dist"),
  ttsRate: process.env.TTS_RATE || "-10%",
};

// Có đủ thông tin Supabase thì dùng Supabase, không thì lưu cục bộ (tiện cho dev/offline).
export const useSupabase = Boolean(config.supabaseUrl && config.supabaseKey);

// Trên server thật (Render) ổ đĩa bị xoá mỗi lần deploy → không cho chạy nếu thiếu Supabase.
if (isProd && !useSupabase) {
  console.error("Thiếu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — production bắt buộc dùng Supabase.");
  process.exit(1);
}
