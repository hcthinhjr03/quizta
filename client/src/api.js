const PASSWORD_KEY = "quizta.adminPassword";

export const adminPassword = {
  get: () => localStorage.getItem(PASSWORD_KEY) ?? "",
  set: (value) => localStorage.setItem(PASSWORD_KEY, value),
  clear: () => localStorage.removeItem(PASSWORD_KEY),
};

/** Sự kiện phát ra khi server báo sai mật khẩu admin → trang admin hiện lại form đăng nhập. */
export const UNAUTHORIZED_EVENT = "quizta:unauthorized";

async function request(path, { method = "GET", body, admin = false, password, raw = false } = {}) {
  const headers = {};
  if (admin) headers["x-admin-password"] = password ?? adminPassword.get();
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload });
  } catch {
    throw new Error("Không kết nối được server. Kiểm tra mạng rồi thử lại.");
  }

  if (res.status === 401 && admin && password === undefined) {
    adminPassword.clear();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Lỗi ${res.status}`);
  }
  if (raw) return res;
  return res.status === 204 ? null : res.json();
}

/** Chuyển object thường thành FormData (bỏ qua giá trị undefined/null). */
export function toFormData(fields) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) fd.append(key, value);
  }
  return fd;
}

export const api = {
  listQuizzes: () => request("/quizzes"),
  getQuiz: (id) => request(`/quizzes/${id}`),
  listVoices: () => request("/voices"),

  login: (password) => request("/admin/login", { method: "POST", admin: true, password }),
  createQuiz: (fields) => request("/quizzes", { method: "POST", body: toFormData(fields), admin: true }),
  updateQuiz: (id, fields) => request(`/quizzes/${id}`, { method: "PUT", body: toFormData(fields), admin: true }),
  deleteQuiz: (id) => request(`/quizzes/${id}`, { method: "DELETE", admin: true }),
  reorderQuestions: (quizId, ids) =>
    request(`/quizzes/${quizId}/questions/order`, { method: "PUT", body: { ids }, admin: true }),

  createQuestion: (quizId, fields) =>
    request(`/quizzes/${quizId}/questions`, { method: "POST", body: toFormData(fields), admin: true }),
  updateQuestion: (id, fields) =>
    request(`/questions/${id}`, { method: "PUT", body: toFormData(fields), admin: true }),
  deleteQuestion: (id) => request(`/questions/${id}`, { method: "DELETE", admin: true }),

  async previewTts(text, voice) {
    const res = await request("/tts/preview", { method: "POST", body: { text, voice }, admin: true, raw: true });
    return res.blob();
  },
};
