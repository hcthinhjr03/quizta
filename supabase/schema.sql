-- Chạy 1 lần trong Supabase Dashboard → SQL Editor → New query → Run.

create table if not exists public.quizzes (
  id            bigint generated always as identity primary key,
  title         text not null,
  level         int  not null default 1,
  thumbnail_key text,
  created_at    timestamptz not null default now()
);

create table if not exists public.questions (
  id          bigint generated always as identity primary key,
  quiz_id     bigint not null references public.quizzes(id) on delete cascade,
  position    int  not null default 0,
  prompt      text not null default 'Listen and choose the correct picture.',
  text        text not null,
  voice       text not null default 'en-US-AnaNeural',
  audio_key   text,
  image_a_key text not null,
  image_b_key text not null,
  correct     char(1) not null check (correct in ('A', 'B')),
  created_at  timestamptz not null default now()
);

create index if not exists questions_quiz_position_idx on public.questions (quiz_id, position);

-- Bật RLS và KHÔNG tạo policy nào: trình duyệt (anon key) không đọc/ghi trực tiếp được.
-- Chỉ server (dùng service_role key, bỏ qua RLS) mới truy cập được dữ liệu.
alter table public.quizzes   enable row level security;
alter table public.questions enable row level security;

-- Bucket công khai chứa ảnh + mp3 (ai có link thì xem được, chỉ server được upload).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
