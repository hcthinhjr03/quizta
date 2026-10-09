import { useState } from "react";
import { api } from "../../api.js";
import ImagePicker from "../../components/ImagePicker.jsx";
import { Button, Field, inputClass, Modal } from "../../components/ui.jsx";
import { compressImage } from "../../lib/image.js";

/** Tạo mới (quiz = undefined) hoặc sửa thông tin một bài. */
export default function QuizFormModal({ quiz, onClose, onSaved }) {
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [level, setLevel] = useState(quiz?.level ?? 1);
  const [thumbnail, setThumbnail] = useState(null);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentThumb = quiz?.hasCustomThumbnail && !removeThumbnail ? quiz.thumbnailUrl : null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fields = {
        title,
        level,
        thumbnail: thumbnail ? await compressImage(thumbnail, { maxSize: 800 }) : undefined,
        removeThumbnail: removeThumbnail && !thumbnail ? "true" : undefined,
      };
      const saved = quiz ? await api.updateQuiz(quiz.id, fields) : await api.createQuiz(fields);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={quiz ? "Sửa thông tin bài" : "Tạo bài mới"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Tên bài">
          <input
            autoFocus
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="vd: Grandpa's Farm"
            className={inputClass}
          />
        </Field>
        <Field label="Level">
          <input
            type="number"
            min={1}
            max={20}
            required
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={`${inputClass} w-28`}
          />
        </Field>
        <Field label="Ảnh bìa (không bắt buộc)" hint="Bỏ trống thì dùng ảnh A của câu hỏi đầu tiên.">
          <ImagePicker value={thumbnail} currentUrl={currentThumb} onChange={setThumbnail} label="Chọn ảnh bìa" className="max-w-64" />
        </Field>
        {(thumbnail || currentThumb) && (
          <button
            type="button"
            className="text-xs font-bold text-rose-500 hover:underline"
            onClick={() => {
              setThumbnail(null);
              setRemoveThumbnail(true);
            }}
          >
            Bỏ ảnh bìa
          </button>
        )}
        {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button type="submit" loading={saving}>{quiz ? "Lưu" : "Tạo bài"}</Button>
        </div>
      </form>
    </Modal>
  );
}
