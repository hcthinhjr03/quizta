import { ImageOff } from "lucide-react";

/** Ảnh tỉ lệ 4:3, có ô thay thế khi chưa có ảnh. */
export default function Thumb({ src, alt = "", className = "" }) {
  return (
    <div className={`aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-sun-300/40 ${className}`}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-brand-200">
          <ImageOff className="size-1/3" />
        </div>
      )}
    </div>
  );
}
