import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import multer from "multer";
import { config, useSupabase } from "./config.js";
import { api } from "./routes.js";
import { uploadsDir } from "./storage/local.js";

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.use("/api", api);

// File media khi chạy chế độ lưu cục bộ (khi dùng Supabase thì file nằm trên Supabase).
app.use("/media", express.static(uploadsDir, { maxAge: "30d", immutable: true }));

// Bản build của React (production): phục vụ file tĩnh + trả index.html cho mọi route khác.
if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist, { index: false }));
  app.get("/{*splat}", (req, res) => res.sendFile(path.join(config.clientDist, "index.html")));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Ảnh quá lớn (tối đa 5MB)" : `Lỗi upload: ${err.message}`;
    return res.status(400).json({ error: message });
  }
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON không hợp lệ" });
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 && config.isProd ? "Lỗi server" : err.message });
});

app.listen(config.port, () => {
  console.log(`QUIZTA server: http://localhost:${config.port}`);
  console.log(`Lưu trữ: ${useSupabase ? "Supabase" : `cục bộ (${config.localDataDir})`}`);
  if (!config.isProd && !process.env.ADMIN_PASSWORD) console.log('Mật khẩu admin (dev): "admin"');
});
