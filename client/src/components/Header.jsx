import { BookOpen, Settings, Volume2 } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
    isActive ? "bg-white/20 text-sun-300" : "text-white/90 hover:bg-white/10"
  }`;

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-brand-500 shadow-md shadow-brand-700/20">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link to="/" className="mr-auto flex items-center gap-2 text-white">
          <span className="grid size-8 place-items-center rounded-xl bg-sun-400 text-brand-700">
            <Volume2 className="size-5" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-black tracking-tight">QUIZTA</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navClass}>
            <BookOpen className="size-4" /> <span className="hidden sm:inline">Bài học</span>
          </NavLink>
          <NavLink to="/admin" className={navClass}>
            <Settings className="size-4" /> <span className="hidden sm:inline">Quản lý</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
