import { useCallback, useEffect, useRef, useState } from "react";

/** Giọng dự phòng của trình duyệt khi câu hỏi chưa có file mp3. */
function speakWithBrowser(text, { onEnd }) {
  const synth = window.speechSynthesis;
  if (!synth) return Promise.reject(new Error("Trình duyệt không hỗ trợ đọc"));
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.85;
  const voice = synth.getVoices().find((v) => v.lang === "en-US" && /natural|google|samantha/i.test(v.name))
    ?? synth.getVoices().find((v) => v.lang.startsWith("en"));
  if (voice) utter.voice = voice;
  utter.onend = onEnd;
  utter.onerror = onEnd;
  synth.speak(utter);
  return Promise.resolve();
}

/**
 * Hook phát câu đọc của 1 câu hỏi: ưu tiên mp3 (giọng Edge), không có thì dùng giọng trình duyệt.
 * `blocked` = true khi trình duyệt chặn tự phát âm thanh → cần người dùng bấm nút loa.
 */
export function useSpeaker() {
  const audioRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async ({ audioUrl, text }) => {
      stop();
      const onEnd = () => setSpeaking(false);
      setSpeaking(true);
      try {
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onended = onEnd;
          audio.onerror = onEnd;
          await audio.play();
        } else {
          await speakWithBrowser(text, { onEnd });
        }
        setBlocked(false);
      } catch (err) {
        setSpeaking(false);
        if (err?.name === "NotAllowedError") setBlocked(true);
      }
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { speak, stop, speaking, blocked };
}

// ---------- hiệu ứng âm thanh đúng/sai (tạo bằng Web Audio, không cần file) ----------

let ctx;
function tone(freq, start, duration, { type = "sine", volume = 0.18, endFreq } = {}) {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration);
}

export function playCorrectSound() {
  try {
    tone(784, 0, 0.15);
    tone(1047, 0.12, 0.28);
  } catch { /* bỏ qua nếu không hỗ trợ */ }
}

export function playWrongSound() {
  try {
    tone(240, 0, 0.32, { type: "triangle", endFreq: 140, volume: 0.22 });
  } catch { /* bỏ qua nếu không hỗ trợ */ }
}
