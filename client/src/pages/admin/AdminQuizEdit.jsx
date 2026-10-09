import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Check, Eye, Pencil, Plus, RefreshCw, Trash2, Volume2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api.js";
import Thumb from "../../components/Thumb.jsx";
import { Button, ErrorBox, IconButton, Spinner, useToast } from "../../components/ui.jsx";
import { useSpeaker } from "../../lib/speech.js";
import { useFetch } from "../../lib/useFetch.js";
import QuestionFormModal from "./QuestionFormModal.jsx";
import QuizFormModal from "./QuizFormModal.jsx";

export default function AdminQuizEdit() {
  const { id } = useParams();
  const { data, error, loading, reload, setData } = useFetch(
    () => Promise.all([api.getQuiz(id), api.listVoices()]),
    [id],
  );
  const [editingQuiz, setEditingQuiz] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null); // null | "new" | question
  const [busyId, setBusyId] = useState(null);
  const { speak } = useSpeaker();
  const toast = useToast();

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const [quiz, voices] = data;
  const questions = quiz.questions;
  const voiceLabel = (vid) => voices.find((v) => v.id === vid)?.label ?? vid;
  const setQuestions = (fn) => setData(([q, v]) => [{ ...q, questions: fn(q.questions) }, v]);

  const afterSave = (saved) => {
    const { warning, ...question } = saved;
    setQuestions((list) =>
      list.some((q) => q.id === question.id) ? list.map((q) => (q.id === question.id ? question : q)) : [...list, question],
    );
    setEditingQuestion(null);
    if (warning) toast(warning, "warning");
    else toast("Đã lưu câu hỏi");
  };

  const move = async (index, delta) => {
    const next = [...questions];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setQuestions(() => next);
    try {
      await api.reorderQuestions(quiz.id, next.map((q) => q.id));
    } catch (err) {
      toast(err.message, "error");
      reload();
    }
  };

  const remove = async (question, index) => {
    if (!window.confirm(`Xoá câu ${index + 1}: "${question.text}"?`)) return;
    try {
      await api.deleteQuestion(question.id);
      setQuestions((list) => list.filter((q) => q.id !== question.id));
      toast("Đã xoá câu hỏi");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  // Gửi PUT rỗng: server sẽ thử tạo lại mp3 cho câu chưa có audio.
  const regenerateAudio = async (question) => {
    setBusyId(question.id);
    try {
      afterSave(await api.updateQuestion(question.id, {}));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand-600">
        <ArrowLeft className="size-4" /> Tất cả bài
      </Link>

      {/* Thông tin bài */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <Thumb src={quiz.thumbnailUrl} className="w-28 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-black">{quiz.title}</h1>
          <p className="text-sm font-semibold text-slate-500">Level {quiz.level} · {questions.length} câu hỏi</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditingQuiz(true)}>
            <Pencil className="size-4" /> Sửa thông tin
          </Button>
          {questions.length > 0 && (
            <a href={`/quiz/${quiz.id}`} target="_blank" rel="noreferrer">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                <Eye className="size-4" /> Xem thử
              </span>
            </a>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Câu hỏi</h2>
        <Button onClick={() => setEditingQuestion("new")}>
          <Plus className="size-4" strokeWidth={3} /> Thêm câu hỏi
        </Button>
      </div>

      {questions.length === 0 && (
        <button
          type="button"
          onClick={() => setEditingQuestion("new")}
          className="w-full rounded-3xl border-2 border-dashed border-slate-200 py-14 text-center font-semibold text-slate-500 hover:border-brand-500 hover:text-brand-600"
        >
          Chưa có câu hỏi nào — bấm để thêm câu đầu tiên
        </button>
      )}

      <ol className="space-y-3">
        {questions.map((q, index) => (
          <li key={q.id} className="flex flex-col gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-black text-brand-600">
                {index + 1}
              </span>
              {[["A", q.imageAUrl], ["B", q.imageBUrl]].map(([option, url]) => (
                <div key={option} className="relative w-24 shrink-0 sm:w-28">
                  <Thumb src={url} className={`ring-offset-1 ${q.correct === option ? "ring-3 ring-emerald-500" : "opacity-70"}`} />
                  <span className={`absolute top-1 left-1 grid size-5 place-items-center rounded-full text-[11px] font-black ${
                    q.correct === option ? "bg-emerald-500 text-white" : "bg-white/90 text-slate-600"
                  }`}>
                    {q.correct === option ? <Check className="size-3" strokeWidth={4} /> : option}
                  </span>
                </div>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800">“{q.text}”</p>
              <p className="text-xs font-semibold text-slate-400">{voiceLabel(q.voice)} · {q.prompt}</p>
              {!q.audioUrl && (
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold text-amber-600">
                  <AlertTriangle className="size-3.5" /> Chưa có giọng Edge (đang dùng giọng trình duyệt)
                  <button
                    type="button"
                    disabled={busyId === q.id}
                    onClick={() => regenerateAudio(q)}
                    className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 hover:bg-amber-100 disabled:opacity-50"
                  >
                    <RefreshCw className={`size-3 ${busyId === q.id ? "animate-spin" : ""}`} /> Tạo lại
                  </button>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-0.5">
              <IconButton label="Nghe" onClick={() => speak(q)} className="text-sun-500 hover:bg-sun-300/30">
                <Volume2 className="size-4" />
              </IconButton>
              <IconButton label="Lên" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUp className="size-4" />
              </IconButton>
              <IconButton label="Xuống" disabled={index === questions.length - 1} onClick={() => move(index, 1)}>
                <ArrowDown className="size-4" />
              </IconButton>
              <IconButton label="Sửa" onClick={() => setEditingQuestion(q)}>
                <Pencil className="size-4" />
              </IconButton>
              <IconButton label="Xoá" onClick={() => remove(q, index)} className="hover:bg-rose-50 hover:text-rose-600">
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </li>
        ))}
      </ol>

      {editingQuiz && (
        <QuizFormModal
          quiz={quiz}
          onClose={() => setEditingQuiz(false)}
          onSaved={(saved) => {
            setData(([q, v]) => [
              {
                ...q,
                ...saved,
                thumbnailUrl: saved.thumbnailUrl ?? q.questions[0]?.imageAUrl ?? null,
                questionCount: q.questions.length,
              },
              v,
            ]);
            setEditingQuiz(false);
            toast("Đã lưu thông tin bài");
          }}
        />
      )}

      {editingQuestion && (
        <QuestionFormModal
          quizId={quiz.id}
          question={editingQuestion === "new" ? undefined : editingQuestion}
          voices={voices}
          onClose={() => setEditingQuestion(null)}
          onSaved={afterSave}
        />
      )}
    </div>
  );
}
