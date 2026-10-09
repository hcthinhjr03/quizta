import { Lock, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { adminPassword, api, UNAUTHORIZED_EVENT } from "../../api.js";
import { Button, inputClass, Spinner } from "../../components/ui.jsx";

/** Chặn các trang /admin bằng mật khẩu (lưu ở localStorage của trình duyệt này). */
export default function AdminGate() {
  const [status, setStatus] = useState(() => (adminPassword.get() ? "checking" : "login"));

  useEffect(() => {
    if (status !== "checking") return;
    api.login(adminPassword.get())
      .then(() => setStatus("ok"))
      .catch(() => {
        adminPassword.clear();
        setStatus("login");
      });
  }, [status]);

  useEffect(() => {
    const onUnauthorized = () => setStatus("login");
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  if (status === "checking") return <Spinner label="Đang kiểm tra..." />;
  if (status === "login") return <LoginForm onSuccess={() => setStatus("ok")} />;

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => {
            adminPassword.clear();
            setStatus("login");
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700"
        >
          <LogOut className="size-3.5" /> Đăng xuất
        </button>
      </div>
      <Outlet />
    </div>
  );
}

function LoginForm({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.login(password);
      adminPassword.set(password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-5 flex flex-col items-center gap-2 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Lock className="size-6" />
        </span>
        <h1 className="text-xl font-black">Trang quản lý</h1>
        <p className="text-sm text-slate-500">Nhập mật khẩu admin để tiếp tục</p>
      </div>
      <input
        type="password"
        autoFocus
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mật khẩu"
        className={inputClass}
      />
      {error && <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}
      <Button type="submit" loading={loading} className="mt-4 w-full">Vào trang quản lý</Button>
    </form>
  );
}
