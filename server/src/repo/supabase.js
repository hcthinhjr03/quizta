import { getSupabase } from "../supabase.js";

function unwrap({ data, error }) {
  if (error) throw new Error(`Lỗi database: ${error.message}`);
  return data;
}

export function createSupabaseRepo() {
  const sb = getSupabase();

  return {
    async ping() {
      unwrap(await sb.from("quizzes").select("id").limit(1));
    },

    async listQuizzes() {
      const rows = unwrap(
        await sb.from("quizzes").select("*, questions(image_a_key, position, id)").order("id"),
      );
      return rows.map(({ questions, ...quiz }) => {
        const first = [...questions].sort((a, b) => a.position - b.position || a.id - b.id)[0];
        return { ...quiz, question_count: questions.length, first_image_key: first?.image_a_key ?? null };
      });
    },

    async getQuiz(id) {
      return unwrap(await sb.from("quizzes").select("*").eq("id", id).maybeSingle());
    },

    async listQuestions(quizId) {
      return unwrap(
        await sb.from("questions").select("*").eq("quiz_id", quizId).order("position").order("id"),
      );
    },

    async createQuiz(fields) {
      return unwrap(await sb.from("quizzes").insert(fields).select().single());
    },

    async updateQuiz(id, patch) {
      return unwrap(await sb.from("quizzes").update(patch).eq("id", id).select().maybeSingle());
    },

    async deleteQuiz(id) {
      const rows = unwrap(await sb.from("quizzes").delete().eq("id", id).select("id"));
      return rows.length > 0;
    },

    async getQuestion(id) {
      return unwrap(await sb.from("questions").select("*").eq("id", id).maybeSingle());
    },

    async createQuestion(fields) {
      const last = unwrap(
        await sb.from("questions").select("position").eq("quiz_id", fields.quiz_id)
          .order("position", { ascending: false }).limit(1).maybeSingle(),
      );
      const position = last ? last.position + 1 : 0;
      return unwrap(await sb.from("questions").insert({ ...fields, position }).select().single());
    },

    async updateQuestion(id, patch) {
      return unwrap(await sb.from("questions").update(patch).eq("id", id).select().maybeSingle());
    },

    async deleteQuestion(id) {
      unwrap(await sb.from("questions").delete().eq("id", id));
    },

    async reorderQuestions(quizId, ids) {
      await Promise.all(
        ids.map(async (id, position) =>
          unwrap(await sb.from("questions").update({ position }).eq("id", id).eq("quiz_id", quizId)),
        ),
      );
    },
  };
}
