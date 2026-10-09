import { ImagePlus, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Ô chọn ảnh: bấm hoặc kéo-thả. `value` là File mới (nếu có), `currentUrl` là ảnh đang lưu trên server.
 */
export default function ImagePicker({ value, currentUrl, onChange, label = "Chọn ảnh", className = "" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!value) return setPreview(null);
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const pick = (file) => {
    if (file && file.type.startsWith("image/")) onChange(file);
  };

  const src = preview ?? currentUrl;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files?.[0]);
      }}
      className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-dashed transition
        focus:ring-2 focus:ring-brand-500 focus:outline-none
        ${dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50 hover:border-brand-500"} ${className}`}
    >
      {src ? (
        <>
          <img src={src} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
            <RefreshCw className="size-4" /> Đổi ảnh
          </div>
        </>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1.5 p-3 text-center text-slate-400">
          <ImagePlus className="size-8" />
          <span className="text-sm font-bold">{label}</span>
          <span className="text-xs">Bấm hoặc kéo-thả ảnh vào đây</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
