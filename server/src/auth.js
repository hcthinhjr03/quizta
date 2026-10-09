import crypto from "node:crypto";
import { config } from "./config.js";

const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();

/** Bảo vệ API admin bằng một mật khẩu duy nhất gửi qua header x-admin-password. */
export function requireAdmin(req, res, next) {
  if (!config.adminPassword) {
    return res.status(503).json({ error: "Server chưa cấu hình ADMIN_PASSWORD" });
  }
  const given = req.get("x-admin-password") ?? "";
  if (!crypto.timingSafeEqual(digest(given), digest(config.adminPassword))) {
    return res.status(401).json({ error: "Sai mật khẩu admin" });
  }
  next();
}
