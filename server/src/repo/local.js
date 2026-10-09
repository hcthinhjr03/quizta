import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";

// "Database" dạng file JSON — chỉ dùng khi chạy local chưa cấu hình Supabase.
const dbFile = path.join(config.localDataDir, "db.json");

function load() {
  if (!fs.existsSync(dbFile)) return { seq: { quiz: 0, question: 0 }, quizzes: [], questions: [] };
  return JSON.parse(fs.readFileSync(dbFile, "utf8"));
}

export function createLocalRepo() {
  const db = load();
  const save = () => {
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    fs.writeFileSync(`${dbFile}.tmp`, JSON.stringify(db, null, 2));
    fs.renameSync(`${dbFile}.tmp`, dbFile);
  };
  const now = () => new Date().toISOString();
  const byPosition = (a, b) => a.position - b.position || a.id - b.id;
  const questionsOf = (quizId) => db.questions.filter((q) => q.quiz_id === quizId).sort(byPosition);

  return {
    async ping() {},

    async listQuizzes() {
      return [...db.quizzes]
        .sort((a, b) => a.id - b.id)
        .map((quiz) => {
          const qs = questionsOf(quiz.id);
          return { ...quiz, question_count: qs.length, first_image_key: qs[0]?.image_a_key ?? null };
        });
    },

    async getQuiz(id) {
      return db.quizzes.find((q) => q.id === id) ?? null;
    },

    async listQuestions(quizId) {
      return questionsOf(quizId);
    },

    async createQuiz(fields) {
      const quiz = { id: ++db.seq.quiz, thumbnail_key: null, ...fields, created_at: now() };
      db.quizzes.push(quiz);
      save();
      return quiz;
    },

    async updateQuiz(id, patch) {
      const quiz = db.quizzes.find((q) => q.id === id);
      if (!quiz) return null;
      Object.assign(quiz, patch);
      save();
      return quiz;
    },

    async deleteQuiz(id) {
      const before = db.quizzes.length;
      db.quizzes = db.quizzes.filter((q) => q.id !== id);
      db.questions = db.questions.filter((q) => q.quiz_id !== id);
      save();
      return db.quizzes.length < before;
    },

    async getQuestion(id) {
      return db.questions.find((q) => q.id === id) ?? null;
    },

    async createQuestion(fields) {
      const last = questionsOf(fields.quiz_id).at(-1);
      const question = {
        id: ++db.seq.question,
        position: last ? last.position + 1 : 0,
        audio_key: null,
        ...fields,
        created_at: now(),
      };
      db.questions.push(question);
      save();
      return question;
    },

    async updateQuestion(id, patch) {
      const question = db.questions.find((q) => q.id === id);
      if (!question) return null;
      Object.assign(question, patch);
      save();
      return question;
    },

    async deleteQuestion(id) {
      db.questions = db.questions.filter((q) => q.id !== id);
      save();
    },

    async reorderQuestions(quizId, ids) {
      ids.forEach((id, index) => {
        const q = db.questions.find((x) => x.id === id && x.quiz_id === quizId);
        if (q) q.position = index;
      });
      save();
    },
  };
}
