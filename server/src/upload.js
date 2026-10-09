import crypto from "node:crypto";
import multer from "multer";
import { storage } from "./storage/index.js";

const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Nhận ảnh vào RAM (tối đa 5MB/ảnh) rồi tự đẩy sang storage. */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter(req, file, cb) {
    if (IMAGE_TYPES[file.mimetype]) cb(null, true);
    else cb(new HttpError(400, `File "${file.originalname}" không phải ảnh hợp lệ (jpg, png, webp, gif)`));
  },
});

export async function saveImage(file) {
  const key = `images/${crypto.randomUUID()}.${IMAGE_TYPES[file.mimetype]}`;
  await storage.put(key, file.buffer, file.mimetype);
  return key;
}

export async function saveAudio(buffer) {
  const key = `audio/${crypto.randomUUID()}.mp3`;
  await storage.put(key, buffer, "audio/mpeg");
  return key;
}
