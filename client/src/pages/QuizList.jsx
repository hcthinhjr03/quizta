import { Pencil, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import Thumb from "../components/Thumb.jsx";
import { ErrorBox, inputClass, Spinner } from "../components/ui.jsx";
import { useFetch } from "../lib/useFetch.js";

export default function QuizList() {
  const { data: quizzes, error, loading, reload } = useFetch(() => api.listQuizzes(), []);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (quizzes ?? []).filter((quiz) => quiz.questionCount > 0 && quiz.title.toLowerCase().includes(q));
  }, [quizzes, query]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Listen & Choose</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Nghe câu tiếng Anh và chọn bức tranh đúng
            {quizzes && <> · {visible.length} bài</>}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bài..."
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {quizzes && visible.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-500">
          {query ? "Không có bài nào khớp từ khoá." : (
            <>
              Chưa có bài nào. Vào <Link to="/admin" className="font-bold text-brand-600 hover:underline">trang Quản lý</Link> để tạo bài đầu tiên.
            </>
          )}
        </div>
      )}

      {visible.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
          {visible.map((quiz, index) => (
            <li key={quiz.id}>
              <Link
                to={`/quiz/${quiz.id}`}
                className="group flex items-center gap-4 p-3 transition hover:bg-brand-50/60 sm:gap-5 sm:p-4"
              >
                <div className="relative w-28 shrink-0 sm:w-36">
                  <Thumb src={quiz.thumbnailUrl} alt={quiz.title} className="shadow-sm" />
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-brand-600 px-1.5 text-xs font-black text-white">
                    Lv {quiz.level}
                  </span>
                </div>
                <span className="hidden w-6 text-right text-lg font-bold text-brand-500 sm:block">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-slate-800 sm:text-lg">{quiz.title}</p>
                  <p className="text-sm font-semibold text-slate-400">{quiz.questionCount} câu hỏi</p>
                </div>
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime-50 text-lime-600 ring-1 ring-lime-200
                    transition group-hover:scale-105 group-hover:bg-lime-500 group-hover:text-white"
                  title="Làm bài"
                >
                  <Pencil className="size-5" strokeWidth={2.5} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
