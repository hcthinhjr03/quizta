import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { config } from "./config.js";

// Danh sách giọng cho admin chọn (giọng neural miễn phí của Microsoft Edge).
export const VOICES = [
  { id: "en-US-AnaNeural", label: "Ana — bé gái (Mỹ)" },
  { id: "en-GB-MaisieNeural", label: "Maisie — bé gái (Anh)" },
  { id: "en-US-JennyNeural", label: "Jenny — nữ (Mỹ)" },
  { id: "en-US-AriaNeural", label: "Aria — nữ (Mỹ)" },
  { id: "en-GB-SoniaNeural", label: "Sonia — nữ (Anh)" },
  { id: "en-US-GuyNeural", label: "Guy — nam (Mỹ)" },
  { id: "en-US-AndrewNeural", label: "Andrew — nam (Mỹ)" },
  { id: "en-GB-RyanNeural", label: "Ryan — nam (Anh)" },
];
export const DEFAULT_VOICE = VOICES[0].id;
export const isValidVoice = (voice) => VOICES.some((v) => v.id === voice);

const TIMEOUT_MS = 20_000;

const escapeXml = (s) =>
  s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]);

/** Đọc text thành file mp3 (Buffer). Ném lỗi nếu dịch vụ Edge không phản hồi. */
export async function synthesize(text, voice = DEFAULT_VOICE) {
  const tts = new MsEdgeTTS();
  let timer;
  try {
    const work = (async () => {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(escapeXml(text), { rate: config.ttsRate });
      const chunks = [];
      for await (const chunk of audioStream) chunks.push(chunk);
      return Buffer.concat(chunks);
    })();
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("TTS quá thời gian chờ")), TIMEOUT_MS);
    });
    const audio = await Promise.race([work, timeout]);
    if (!audio.length) throw new Error("TTS trả về audio rỗng");
    return audio;
  } finally {
    clearTimeout(timer);
    tts.close();
  }
}
