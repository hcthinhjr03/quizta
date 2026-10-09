// Tạo 1 bài mẫu "Colors & Shapes" qua API (tranh vẽ bằng code, không cần file ảnh).
// Dùng:  node scripts/seed.js [http://localhost:3001] [mật-khẩu-admin]
import zlib from "node:zlib";

const BASE = (process.argv[2] ?? "http://localhost:3001").replace(/\/$/, "");
const PASSWORD = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? "admin";
const W = 640;
const H = 480;

// ---------- vẽ PNG tối giản ----------

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function canvas(bg) {
  const px = new Uint8Array(W * H * 3);
  const [r, g, b] = hex(bg);
  for (let i = 0; i < W * H; i++) px.set([r, g, b], i * 3);
  const fill = (inside, color) => {
    const c = hex(color);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x + 0.5, y + 0.5)) px.set(c, (y * W + x) * 3);
  };
  return {
    circle: (cx, cy, rad, color) => fill((x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad, color),
    rect: (x0, y0, w, h, color) => fill((x, y) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h, color),
    triangle: ([ax, ay], [bx, by], [cx, cy], color) => {
      const side = (px1, py1, px2, py2, x, y) => (x - px2) * (py1 - py2) - (px1 - px2) * (y - py2);
      fill((x, y) => {
        const d1 = side(x, y, ax, ay, bx, by) < 0;
        const d2 = side(x, y, bx, by, cx, cy) < 0;
        const d3 = side(x, y, cx, cy, ax, ay) < 0;
        return d1 === d2 && d2 === d3;
      }, color);
    },
    png() {
      const raw = Buffer.alloc((W * 3 + 1) * H);
      for (let y = 0; y < H; y++) Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
      const chunk = (type, data) => {
        const body = Buffer.concat([Buffer.from(type), data]);
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length);
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE(zlib.crc32(body));
        return Buffer.concat([len, body, crc]);
      };
      const ihdr = Buffer.alloc(13);
      ihdr.writeUInt32BE(W, 0);
      ihdr.writeUInt32BE(H, 4);
      ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
      return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", ihdr),
        chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
        chunk("IEND", Buffer.alloc(0)),
      ]);
    },
  };
}

const draw = (bg, paint) => {
  const c = canvas(bg);
  paint(c);
  return c.png();
};

const QUESTIONS = [
  {
    text: "The ball is red.",
    correct: "A",
    a: draw("#fff4e0", (c) => c.circle(320, 240, 140, "#e53935")),
    b: draw("#e8f4ff", (c) => c.circle(320, 240, 140, "#1e88e5")),
  },
  {
    text: "This is a green triangle.",
    correct: "B",
    a: draw("#f1fbe9", (c) => c.rect(190, 110, 260, 260, "#43a047")),
    b: draw("#f1fbe9", (c) => c.triangle([320, 90], [490, 390], [150, 390], "#43a047")),
  },
  {
    text: "I see two blue balls.",
    correct: "B",
    a: draw("#eef6ff", (c) => c.circle(320, 240, 110, "#1e88e5")),
    b: draw("#eef6ff", (c) => {
      c.circle(200, 240, 100, "#1e88e5");
      c.circle(440, 240, 100, "#1e88e5");
    }),
  },
  {
    text: "The yellow box is big.",
    correct: "A",
    a: draw("#fffbe6", (c) => c.rect(130, 70, 380, 340, "#fbc02d")),
    b: draw("#fffbe6", (c) => c.rect(260, 180, 120, 120, "#fbc02d")),
  },
];

// ---------- gọi API ----------

async function call(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + "/api" + path, { method, body, headers: { "x-admin-password": PASSWORD } });
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${data?.error}`);
  return data;
}

const form = (fields) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (Buffer.isBuffer(v)) fd.append(k, new Blob([v], { type: "image/png" }), `${k}.png`);
    else fd.append(k, String(v));
  }
  return fd;
};

const quiz = await call("/quizzes", { method: "POST", body: form({ title: "Colors & Shapes (demo)", level: 1 }) });
console.log(`Đã tạo bài #${quiz.id}: ${quiz.title}`);
for (const [i, q] of QUESTIONS.entries()) {
  const saved = await call(`/quizzes/${quiz.id}/questions`, {
    method: "POST",
    body: form({ text: q.text, correct: q.correct, image_a: q.a, image_b: q.b }),
  });
  console.log(`  Câu ${i + 1}: "${saved.text}" — audio: ${saved.audioUrl ? "OK" : "KHÔNG (" + saved.warning + ")"}`);
}
console.log(`Xong! Mở ${BASE}/quiz/${quiz.id} để làm thử.`);
