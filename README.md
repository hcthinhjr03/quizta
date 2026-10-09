# QUIZTA — Listen & Choose

Web quiz luyện nghe tiếng Anh: mỗi **bài** gồm nhiều **câu hỏi**, mỗi câu có 1 câu tiếng Anh được đọc lên
(giọng AI miễn phí của Microsoft Edge) và 2 tranh để chọn.

- `/` — danh sách bài · `/quiz/:id` — làm bài · `/admin` — quản lý (cần mật khẩu)
- Stack: Node.js + Express · React (Vite) + Tailwind · Supabase (Postgres + Storage) · deploy Render

## Chạy trên máy (dev)

Cần Node.js ≥ 22.12.

```bash
npm install
npm run dev          # client: http://localhost:5173  ·  server: http://localhost:3001
npm run seed         # (tuỳ chọn) tạo 1 bài demo "Colors & Shapes"
```

Chưa cấu hình Supabase thì dữ liệu lưu tạm trong `server/.local-data/` (mật khẩu admin mặc định: `admin`).
Muốn dùng Supabase khi dev: copy `server/.env.example` → `server/.env` rồi điền giá trị.

## Thiết lập Supabase (1 lần)

1. Tạo project tại https://supabase.com (Region: Singapore cho nhanh).
2. **SQL Editor** → New query → dán toàn bộ `supabase/schema.sql` → **Run**.
   (tạo bảng `quizzes`, `questions` và bucket `media`)
3. **Project Settings → API**: lấy `Project URL` và khoá `service_role` (giữ bí mật, chỉ đặt ở server).

## Deploy lên Render (free)

1. Push code lên GitHub.
2. Render → **New → Blueprint** → chọn repo (Render đọc `render.yaml`).
3. Điền 3 biến: `ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` → Deploy.
4. Mở link `https://<tên>.onrender.com`. Từ đó mỗi lần push lên `main` Render tự deploy lại.

Lưu ý gói free: server "ngủ" sau 15 phút không dùng → lần mở đầu chờ ~30–60 giây.

## Giữ Supabase không bị pause

Supabase free tạm dừng project sau 7 ngày không hoạt động. Workflow `.github/workflows/keepalive.yml`
gọi `/api/health` mỗi 3 ngày — chỉ cần tạo biến **APP_URL** (vd `https://quizta.onrender.com`) tại
GitHub repo → Settings → Secrets and variables → Actions → **Variables**.

## Cấu trúc

```
server/src/   index.js (Express) · routes.js (API) · tts.js (giọng đọc) · repo/ (DB) · storage/ (file)
client/src/   pages/QuizList · pages/QuizPlay · pages/admin/* · lib/ (speech, nén ảnh)
supabase/     schema.sql
scripts/      dev.js (chạy server + client) · seed.js (dữ liệu demo)
```
