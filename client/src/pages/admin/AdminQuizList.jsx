import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api.js";
import Thumb from "../../components/Thumb.jsx";
import { Button, ErrorBox, IconButton, Spinner, useToast } from "../../components/ui.jsx";
import { useFetch } from "../../lib/useFetch.js";
import QuizFormModal from "./QuizFormModal.jsx";

export default function AdminQuizList() {
  const { data: quizzes, error, loading, reload, setData } = useFetch(() => api.listQuizzes(), []);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const remove = async (quiz) => {
    if (!window.confirm(`Xoá bài "${quiz.title}" và toàn bộ ${quiz.questionCount} câu hỏi?`)) return;
    try {
      await api.deleteQuiz(quiz.id);
      setData((list) => list.filter((q) => q.id !== quiz.id));
      toast("Đã xoá bài");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Quản lý bài học</h1>
          <p className="text-sm font-semibold text-slate-500">Mỗi bài gồm nhiều câu hỏi nghe & chọn tranh</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" strokeWidth={3} /> Tạo bài mới
        </Button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {quizzes?.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-500">
          Chưa có bài nào — bấm <b>Tạo bài mới</b> để bắt đầu.
        </div>
      )}

      {quizzes?.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
          {quizzes.map((quiz) => (
            <li key={quiz.id} className="flex items-center gap-3 p-3 sm:gap-4">
              <Link to={`/admin/quiz/${quiz.id}`} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <Thumb src={quiz.thumbnailUrl} className="w-20 shrink-0 sm:w-24" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-800 hover:text-brand-600">{quiz.title}</p>
                  <p className="text-sm font-semibold text-slate-400">
                    Level {quiz.level} · {quiz.questionCount} câu hỏi
                    {quiz.questionCount === 0 && <span className="text-amber-500"> · chưa hiện ở trang chính</span>}
                  </p>
                </div>
              </Link>
              <IconButton label="Sửa" onClick={() => navigate(`/admin/quiz/${quiz.id}`)}>
                <Pencil className="size-4" />
              </IconButton>
              <IconButton label="Xoá" onClick={() => remove(quiz)} className="hover:bg-rose-50 hover:text-rose-600">
                <Trash2 className="size-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <QuizFormModal
          onClose={() => setCreating(false)}
          onSaved={(quiz) => {
            toast("Đã tạo bài — giờ thêm câu hỏi nhé!");
            navigate(`/admin/quiz/${quiz.id}`);
          }}
        />
      )}
    </div>
  );
}
