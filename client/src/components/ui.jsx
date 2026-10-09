import { CircleAlert, LoaderCircle, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const BUTTON_VARIANTS = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/30",
  secondary: "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
  danger: "bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50",
  ghost: "text-slate-600 hover:bg-slate-100",
};

export function Button({ variant = "primary", loading = false, className = "", children, disabled, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition
        disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function IconButton({ label, className = "", children, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100
        hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ label = "Đang tải..." }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
      <LoaderCircle className="size-8 animate-spin" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl bg-rose-50 p-6 text-center text-rose-700">
      <CircleAlert className="size-8" />
      <p className="font-semibold">{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Thử lại</Button>}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm ring-1 ring-slate-200 transition " +
  "placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none";

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl
          ${wide ? "sm:max-w-3xl" : "sm:max-w-md"}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <IconButton label="Đóng" onClick={onClose}><X className="size-5" /></IconButton>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- toast ----------

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === "error" ? 6000 : 3500);
  }, []);

  const colors = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    warning: "bg-amber-500",
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className={`animate-pop rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg ${colors[t.type]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
