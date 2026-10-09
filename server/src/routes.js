import express from "express";
import { requireAdmin } from "./auth.js";
import { repo } from "./repo/index.js";
import { removeQuietly, storage, urlOf } from "./storage/index.js";
import { DEFAULT_VOICE, VOICES, isValidVoice, synthesize } from "./tts.js";
import { HttpError, imageUpload, saveAudio, saveImage } from "./upload.js";

export const api = express.Router();

const DEFAULT_PROMPT = "Listen and choose the correct picture.";

// ---------- helpers ----------

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, "Không tìm thấy");
  return id;
}

function cleanText(value, { field, max, required = true }) {
  const text = String(value ?? "").trim();
  if (required && !text) throw new HttpError(400, `Thiếu ${field}`);
  if (text.length > max) throw new HttpError(400, `${field} tối đa ${max} ký tự`);
  return text;
}

function cleanLevel(value) {
  const level = Number(value ?? 1);
  if (!Number.isInteger(level) || level < 1 || level > 20) throw new HttpError(400, "Level phải từ 1 đến 20");
  return level;
}

function cleanCorrect(value) {
  if (value !== "A" && value !== "B") throw new HttpError(400, "Đáp án đúng phải là A hoặc B");
  return value;
}

function cleanVoice(value) {
  if (!value) return DEFAULT_VOICE;
  if (!isValidVoice(value)) throw new HttpError(400, "Giọng đọc không hợp lệ");
  return value;
}

const fileOf = (req, name) => req.files?.[name]?.[0];

const quizDto = (q) => ({
  id: q.id,
  title: q.title,
  level: q.level,
  thumbnailUrl: urlOf(q.thumbnail_key ?? q.first_image_key),
  hasCustomThumbnail: Boolean(q.thumbnail_key),
  questionCount: q.question_count,
  createdAt: q.created_at,
});

const questionDto = (q) => ({
  id: q.id,
  quizId: q.quiz_id,
  position: q.position,
  prompt: q.prompt,
  text: q.text,
  voice: q.voice,
  audioUrl: urlOf(q.audio_key),
  imageAUrl: urlOf(q.image_a_key),
  imageBUrl: urlOf(q.image_b_key),
  correct: q.correct,
});

/** Tạo mp3 cho câu hỏi; lỗi thì trả về { key: null, error } để client tự dùng giọng trình duyệt. */
async function generateAudio(text, voice) {
  try {
    return { key: await saveAudio(await synthesize(text, voice)), error: null };
  } catch (err) {
    console.warn("TTS lỗi:", err.message);
    return { key: null, error: "Không tạo được giọng đọc, web sẽ tạm dùng giọng của trình duyệt." };
  }
}

async function findQuiz(id) {
  const quiz = await repo.getQuiz(id);
  if (!quiz) throw new HttpError(404, "Không tìm thấy bài");
  return quiz;
}

async function findQuestion(id) {
  const question = await repo.getQuestion(id);
  if (!question) throw new HttpError(404, "Không tìm thấy câu hỏi");
  return question;
}

// ---------- public ----------

api.get("/health", async (req, res) => {
  await repo.ping(); // chạm vào DB để Supabase không bị pause vì "không hoạt động"
  res.json({ ok: true, storage: storage.kind });
});

api.get("/voices", (req, res) => res.json(VOICES));

api.get("/quizzes", async (req, res) => {
  res.json((await repo.listQuizzes()).map(quizDto));
});

api.get("/quizzes/:id", async (req, res) => {
  const quiz = await findQuiz(parseId(req.params.id));
  const questions = await repo.listQuestions(quiz.id);
  res.json({
    ...quizDto({ ...quiz, question_count: questions.length, first_image_key: questions[0]?.image_a_key }),
    questions: questions.map(questionDto),
  });
});

// ---------- admin ----------

const quizFiles = imageUpload.fields([{ name: "thumbnail", maxCount: 1 }]);
const questionFiles = imageUpload.fields([
  { name: "image_a", maxCount: 1 },
  { name: "image_b", maxCount: 1 },
]);

api.post("/admin/login", requireAdmin, (req, res) => res.status(204).end());

api.post("/tts/preview", requireAdmin, async (req, res) => {
  const text = cleanText(req.body?.text, { field: "câu đọc", max: 300 });
  const audio = await synthesize(text, cleanVoice(req.body?.voice)).catch((err) => {
    throw new HttpError(502, `Không tạo được giọng đọc: ${err.message}`);
  });
  res.type("audio/mpeg").send(audio);
});

api.post("/quizzes", requireAdmin, quizFiles, async (req, res) => {
  const title = cleanText(req.body.title, { field: "tên bài", max: 120 });
  const level = cleanLevel(req.body.level);
  const thumb = fileOf(req, "thumbnail");
  const thumbnail_key = thumb ? await saveImage(thumb) : null;
  const quiz = await repo.createQuiz({ title, level, thumbnail_key });
  res.status(201).json(quizDto({ ...quiz, question_count: 0 }));
});

api.put("/quizzes/:id", requireAdmin, quizFiles, async (req, res) => {
  const quiz = await findQuiz(parseId(req.params.id));
  const patch = {};
  if (req.body.title !== undefined) patch.title = cleanText(req.body.title, { field: "tên bài", max: 120 });
  if (req.body.level !== undefined) patch.level = cleanLevel(req.body.level);

  const thumb = fileOf(req, "thumbnail");
  if (thumb) patch.thumbnail_key = await saveImage(thumb);
  else if (req.body.removeThumbnail === "true") patch.thumbnail_key = null;

  const updated = await repo.updateQuiz(quiz.id, patch);
  if ("thumbnail_key" in patch) await removeQuietly([quiz.thumbnail_key]);
  res.json(quizDto(updated));
});

api.delete("/quizzes/:id", requireAdmin, async (req, res) => {
  const quiz = await findQuiz(parseId(req.params.id));
  const questions = await repo.listQuestions(quiz.id);
  await repo.deleteQuiz(quiz.id);
  await removeQuietly([
    quiz.thumbnail_key,
    ...questions.flatMap((q) => [q.image_a_key, q.image_b_key, q.audio_key]),
  ]);
  res.status(204).end();
});

api.put("/quizzes/:id/questions/order", requireAdmin, async (req, res) => {
  const quiz = await findQuiz(parseId(req.params.id));
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || !ids.every(Number.isInteger)) throw new HttpError(400, "ids không hợp lệ");
  await repo.reorderQuestions(quiz.id, ids);
  res.status(204).end();
});

api.post("/quizzes/:id/questions", requireAdmin, questionFiles, async (req, res) => {
  const quiz = await findQuiz(parseId(req.params.id));
  const text = cleanText(req.body.text, { field: "câu đọc", max: 300 });
  const prompt = cleanText(req.body.prompt, { field: "câu lệnh", max: 200, required: false }) || DEFAULT_PROMPT;
  const voice = cleanVoice(req.body.voice);
  const correct = cleanCorrect(req.body.correct);
  const imageA = fileOf(req, "image_a");
  const imageB = fileOf(req, "image_b");
  if (!imageA || !imageB) throw new HttpError(400, "Cần đủ 2 ảnh đáp án A và B");

  const [image_a_key, image_b_key, audio] = await Promise.all([
    saveImage(imageA),
    saveImage(imageB),
    generateAudio(text, voice),
  ]);
  try {
    const question = await repo.createQuestion({
      quiz_id: quiz.id, prompt, text, voice, correct, image_a_key, image_b_key, audio_key: audio.key,
    });
    res.status(201).json({ ...questionDto(question), warning: audio.error });
  } catch (err) {
    await removeQuietly([image_a_key, image_b_key, audio.key]);
    throw err;
  }
});

api.put("/questions/:id", requireAdmin, questionFiles, async (req, res) => {
  const question = await findQuestion(parseId(req.params.id));
  const patch = {};
  const b = req.body ?? {};
  if (b.text !== undefined) patch.text = cleanText(b.text, { field: "câu đọc", max: 300 });
  if (b.prompt !== undefined) {
    patch.prompt = cleanText(b.prompt, { field: "câu lệnh", max: 200, required: false }) || DEFAULT_PROMPT;
  }
  if (b.voice !== undefined) patch.voice = cleanVoice(b.voice);
  if (b.correct !== undefined) patch.correct = cleanCorrect(b.correct);

  const oldKeys = [];
  for (const [field, column] of [["image_a", "image_a_key"], ["image_b", "image_b_key"]]) {
    const file = fileOf(req, field);
    if (file) {
      patch[column] = await saveImage(file);
      oldKeys.push(question[column]);
    }
  }

  // Tạo lại giọng đọc khi đổi text/giọng, hoặc khi lần trước tạo thất bại.
  let warning = null;
  const textChanged = patch.text !== undefined && patch.text !== question.text;
  const voiceChanged = patch.voice !== undefined && patch.voice !== question.voice;
  if (textChanged || voiceChanged || !question.audio_key) {
    const audio = await generateAudio(patch.text ?? question.text, patch.voice ?? question.voice);
    warning = audio.error;
    if (audio.key) {
      patch.audio_key = audio.key;
      oldKeys.push(question.audio_key);
    }
  }

  const updated = await repo.updateQuestion(question.id, patch);
  await removeQuietly(oldKeys);
  res.json({ ...questionDto(updated), warning });
});

api.delete("/questions/:id", requireAdmin, async (req, res) => {
  const question = await findQuestion(parseId(req.params.id));
  await repo.deleteQuestion(question.id);
  await removeQuietly([question.image_a_key, question.image_b_key, question.audio_key]);
  res.status(204).end();
});

api.use((req, res) => res.status(404).json({ error: "API không tồn tại" }));
