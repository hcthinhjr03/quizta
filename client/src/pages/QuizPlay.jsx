import { ArrowLeft, Check, ChevronRight, RotateCcw, Star, Timer, Trophy, Turtle, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import Thumb from "../components/Thumb.jsx";
import { Button, ErrorBox, Spinner } from "../components/ui.jsx";
import { playCorrectSound, playWrongSound, useSpeaker } from "../lib/speech.js";
import { useFetch } from "../lib/useFetch.js";

const SECONDS_PER_QUESTION = 40;

const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function QuizPlay() {
  const { id } = useParams();
  const { data: quiz, error, loading, reload } = useFetch(() => api.getQuiz(id), [id]);
  const [run, setRun] = useState(0);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!quiz.questions.length) {
    return <ErrorBox message="Bài này chưa có câu hỏi nào." />;
  }
  return <Player key={run} quiz={quiz} onRestart={() => setRun((r) => r + 1)} />;
}

function Player({ quiz, onRestart }) {
  const questions = quiz.questions;
  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState({}); // { [index]: "A" | "B" }
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(total * SECONDS_PER_QUESTION);
  const { speak, stop, speaking, blocked } = useSpeaker();

  const question = questions[index];
  const choice = choices[index];
  const score = Object.entries(choices).filter(([i, c]) => questions[i].correct === c).length;

  // Đồng hồ đếm ngược; hết giờ thì kết thúc bài.
  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [finished]);
  useEffect(() => {
    if (timeLeft === 0) setFinished(true);
  }, [timeLeft]);

  // Tự đọc khi sang câu mới.
  useEffect(() => {
    if (finished) stop();
    else speak(question);
  }, [question, finished, speak, stop]);

  const choose = useCallback(
    (option) => {
      if (choice || finished) return;
      setChoices((c) => ({ ...c, [index]: option }));
      if (option === question.correct) playCorrectSound();
      else playWrongSound();
    },
    [choice, finished, index, question],
  );

  const next = useCallback(() => {
    if (!choice) return;
    if (index + 1 < total) setIndex(index + 1);
    else setFinished(true);
  }, [choice, index, total]);

  // Phím tắt: 1/2 hoặc ←/→ để chọn, Enter để qua câu, Space để nghe lại, S để đọc chậm.
  useEffect(() => {
    if (finished) return;
    const onKey = (e) => {
      if (e.target.closest("input, textarea")) return;
      if (["1", "a", "ArrowLeft"].includes(e.key)) choose("A");
      else if (["2", "b", "ArrowRight"].includes(e.key)) choose("B");
      else if (e.key === "Enter") next();
      else if (e.key === "s" || e.key === "S") speak(question, { slow: true });
      else if (e.key === " ") {
        e.preventDefault();
        speak(question);
      } else return;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, choose, next, speak, question]);

  if (finished) {
    return <Result quiz={quiz} choices={choices} score={score} timeUp={timeLeft === 0} onRestart={onRestart} />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Thanh trên: tên bài, thời gian, điểm */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 font-bold text-slate-500 hover:text-brand-600">
          <ArrowLeft className="size-5 shrink-0" />
          <span className="truncate">{quiz.title}</span>
        </Link>
        <div className={`flex items-center gap-1.5 font-black tabular-nums ${timeLeft <= 30 ? "text-rose-500" : "text-brand-700"}`}>
          <Timer className="size-5" /> {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-1.5 font-black text-brand-700 tabular-nums">
          <Trophy className="size-5 text-sun-500" /> {score}/{total}
        </div>
      </div>

      {/* Tiến độ */}
      <div className="mb-5 flex gap-1.5">
        {questions.map((q, i) => {
          const c = choices[i];
          const color = c ? (c === q.correct ? "bg-emerald-400" : "bg-rose-400") : i === index ? "bg-brand-500" : "bg-slate-200";
          return <div key={q.id} className={`h-2 flex-1 rounded-full transition-colors ${color}`} />;
        })}
      </div>

      {/* Câu lệnh + nút loa */}
      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
        <div className="flex items-center gap-3">
          <p className="flex-1 text-lg font-bold text-slate-700 sm:text-xl">
            {index + 1}. {question.prompt}
          </p>
          <button
            type="button"
            onClick={() => speak(question, { slow: true })}
            aria-label="Đọc chậm"
            title="Đọc chậm (S)"
            className={`grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm
              transition hover:scale-105 hover:bg-emerald-200 active:scale-95
              ${speaking === "slow" ? "scale-105 bg-emerald-200" : ""}`}
          >
            <Turtle className={`size-6 ${speaking === "slow" ? "animate-pulse" : ""}`} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => speak(question)}
            aria-label="Nghe lại"
            title="Nghe lại (Space)"
            className={`grid size-14 shrink-0 place-items-center rounded-full bg-sun-400 text-slate-800 shadow-md
              shadow-sun-500/40 transition hover:scale-105 hover:bg-sun-300 active:scale-95
              ${speaking === "normal" ? "scale-105 bg-sun-300" : ""} ${blocked ? "animate-ring" : ""}`}
          >
            <Volume2 className={`size-7 ${speaking === "normal" ? "animate-pulse" : ""}`} strokeWidth={2.5} />
          </button>
        </div>
        {blocked && !choice && (
          <p className="mt-2 text-sm font-semibold text-amber-600">Bấm vào nút loa vàng để nghe câu hỏi nhé!</p>
        )}
        {choice && (
          <p className="animate-pop mt-3 rounded-2xl bg-brand-50 px-4 py-2 text-lg font-bold text-brand-700">
            “{question.text}”
          </p>
        )}
      </div>

      {/* 2 đáp án ảnh */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {["A", "B"].map((option) => (
          <ImageChoice
            key={`${question.id}-${option}`}
            option={option}
            src={option === "A" ? question.imageAUrl : question.imageBUrl}
            chosen={choice === option}
            revealed={Boolean(choice)}
            isCorrect={question.correct === option}
            onChoose={() => choose(option)}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button onClick={next} disabled={!choice} className="h-14 min-w-48 rounded-2xl text-lg">
          {index + 1 < total ? "Câu tiếp" : "Xem kết quả"} <ChevronRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}

function ImageChoice({ option, src, chosen, revealed, isCorrect, onChoose }) {
  let state = "idle";
  if (revealed) state = isCorrect ? "correct" : chosen ? "wrong" : "dim";

  const styles = {
    idle: "ring-slate-200 hover:-translate-y-1 hover:ring-brand-500 hover:shadow-xl",
    correct: "ring-emerald-500 ring-4 shadow-lg shadow-emerald-500/20",
    wrong: "ring-rose-500 ring-4 animate-shake",
    dim: "ring-slate-200 opacity-50",
  };

  return (
    <button
      type="button"
      onClick={onChoose}
      disabled={revealed}
      aria-label={`Chọn tranh ${option}`}
      className={`relative rounded-2xl bg-white p-1.5 shadow-sm ring-2 transition duration-200 disabled:cursor-default
        sm:rounded-3xl sm:p-2 ${styles[state]}`}
    >
      <Thumb src={src} alt={`Tranh ${option}`} className="rounded-xl sm:rounded-2xl" />
      <span className="absolute top-3 left-3 grid size-8 place-items-center rounded-full bg-white/90 text-sm font-black text-slate-600 shadow sm:top-4 sm:left-4">
        {option}
      </span>
      {state === "correct" && (
        <span className="animate-pop absolute -top-3 -right-3 grid size-11 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
          <Check className="size-6" strokeWidth={3.5} />
        </span>
      )}
      {state === "wrong" && (
        <span className="animate-pop absolute -top-3 -right-3 grid size-11 place-items-center rounded-full bg-rose-500 text-white shadow-lg">
          <X className="size-6" strokeWidth={3.5} />
        </span>
      )}
    </button>
  );
}

function Result({ quiz, choices, score, timeUp, onRestart }) {
  const total = quiz.questions.length;
  const ratio = score / total;
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;
  const message = ["Cố gắng lần sau nhé!", "Khá lắm!", "Giỏi lắm!", "Xuất sắc!"][stars];
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100 sm:p-8">
        {timeUp && <p className="mb-2 text-sm font-bold text-rose-500">Hết giờ rồi!</p>}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <Star
              key={n}
              className={`animate-pop size-12 ${n <= stars ? "fill-sun-400 text-sun-500" : "fill-slate-100 text-slate-200"}`}
              style={{ animationDelay: `${n * 0.15}s` }}
            />
          ))}
        </div>
        <p className="mt-4 text-5xl font-black text-brand-600 tabular-nums">
          {score}<span className="text-3xl text-slate-300">/{total}</span>
        </p>
        <p className="mt-1 text-xl font-extrabold text-slate-700">{message}</p>
        <p className="mt-1 text-sm font-semibold text-slate-400">{quiz.title}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={onRestart} className="rounded-2xl">
            <RotateCcw className="size-4" /> Làm lại
          </Button>
          <Button variant="secondary" className="rounded-2xl" onClick={() => navigate("/")}>
            Danh sách bài
          </Button>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {quiz.questions.map((q, i) => {
          const c = choices[i];
          const ok = c === q.correct;
          return (
            <li key={q.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
              <Thumb src={q.correct === "A" ? q.imageAUrl : q.imageBUrl} className="w-16 shrink-0 rounded-lg" />
              <p className="min-w-0 flex-1 text-sm font-semibold text-slate-700">
                <span className="text-slate-400">{i + 1}.</span> {q.text}
              </p>
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full ${
                  !c ? "bg-slate-100 text-slate-400" : ok ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                }`}
                title={!c ? "Chưa làm" : ok ? "Đúng" : "Sai"}
              >
                {!c ? "–" : ok ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
