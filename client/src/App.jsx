import { Link, Route, Routes } from "react-router-dom";
import Header from "./components/Header.jsx";
import { ToastProvider } from "./components/ui.jsx";
import AdminGate from "./pages/admin/AdminGate.jsx";
import AdminQuizEdit from "./pages/admin/AdminQuizEdit.jsx";
import AdminQuizList from "./pages/admin/AdminQuizList.jsx";
import QuizList from "./pages/QuizList.jsx";
import QuizPlay from "./pages/QuizPlay.jsx";

function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl font-black text-brand-200">404</p>
      <p className="mt-2 font-semibold text-slate-500">Không tìm thấy trang này.</p>
      <Link to="/" className="mt-6 inline-block font-bold text-brand-600 hover:underline">← Về danh sách bài</Link>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-dvh">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pt-6 pb-16">
          <Routes>
            <Route path="/" element={<QuizList />} />
            <Route path="/quiz/:id" element={<QuizPlay />} />
            <Route path="/admin" element={<AdminGate />}>
              <Route index element={<AdminQuizList />} />
              <Route path="quiz/:id" element={<AdminQuizEdit />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
