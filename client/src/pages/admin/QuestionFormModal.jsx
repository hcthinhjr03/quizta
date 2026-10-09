import { Check, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../api.js";
import ImagePicker from "../../components/ImagePicker.jsx";
import { Button, Field, inputClass, Modal } from "../../components/ui.jsx";
import { compressImage } from "../../lib/image.js";

const DEFAULT_PROMPT = "Listen and choose the correct picture.";

/** Thêm mới (question = undefined) hoặc sửa một câu hỏi. */
export default function QuestionFormModal({ quizId, question, voices, onClose, onSaved }) {
  const [text, setText] = useState(question?.text ?? "");
  const [voice, setVoice] = useState(question?.voice ?? voices[0]?.id ?? "");
  const [prompt, setPrompt] = useState(question && question.prompt !== DEFAULT_PROMPT ? question.prompt : "");
  const [imageA, setImageA] = useState(null);
  const [imageB, setImageB] = useState(null);
  const [correct, setCorrect] = useState(question?.correct ?? "A");
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  const preview = async () => {
    if (!text.trim()) return setError("Nhập câu đọc trước khi nghe thử");
    setPreviewing(true);
    setError("");
    try {
      const blob = await api.previewTts(text, voice);
      audioRef.current?.pause();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewing(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!question && (!imageA || !imageB)) return setError("Cần chọn đủ 2 ảnh A và B");
    setSaving(true);
    setError("");
    try {
      const [a, b] = await Promise.all([imageA && compressImage(imageA), imageB && compressImage(imageB)]);
      const fields = { text, voice, prompt, correct, image_a: a || undefined, image_b: b || undefined };
      const saved = question
        ? await api.updateQuestion(question.id, fields)
        : await api.createQuestion(quizId, fields);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const images = [
    { option: "A", value: imageA, setValue: setImageA, currentUrl: question?.imageAUrl },
    { option: "B", value: imageB, setValue: setImageB, currentUrl: question?.imageBUrl },
  ];

  return (
    <Modal title={question ? "Sửa câu hỏi" : "Thêm câu hỏi"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Câu đọc (tiếng Anh)" hint="Đây là câu sẽ được đọc lên khi bấm nút loa.">
          <textarea
            autoFocus
            required
            rows={2}
            maxLength={300}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="vd: Grandpa feeds the sheep."
            className={`${inputClass} resize-y text-base`}
          />
        </Field>

        <div className="flex flex-wrap items-end gap-3">
          <Field label="Giọng đọc">
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className={`${inputClass} min-w-56`}>
              {voices.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </Field>
          <Button type="button" variant="secondary" onClick={preview} loading={previewing}>
            {!previewing && <Volume2 className="size-4" />} Nghe thử
          </Button>
        </div>

        <Field label="Câu lệnh hiển thị (không bắt buộc)">
          <input
            maxLength={200}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={DEFAULT_PROMPT}
            className={inputClass}
          />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-bold text-slate-700">2 tranh đáp án — bấm “Đáp án đúng” dưới tranh đúng</p>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {images.map(({ option, value, setValue, currentUrl }) => {
              const isCorrect = correct === option;
              return (
                <div key={option} className="space-y-2">
                  <div className={`rounded-2xl p-1 transition ${isCorrect ? "bg-emerald-400" : "bg-transparent"}`}>
                    <ImagePicker value={value} currentUrl={currentUrl} onChange={setValue} label={`Tranh ${option}`} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCorrect(option)}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition ${
                      isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    {isCorrect && <Check className="size-4" strokeWidth={3} />}
                    {isCorrect ? `Tranh ${option} là đáp án đúng` : `Chọn tranh ${option} là đáp án đúng`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button type="submit" loading={saving}>{question ? "Lưu thay đổi" : "Thêm câu hỏi"}</Button>
        </div>
      </form>
    </Modal>
  );
}
