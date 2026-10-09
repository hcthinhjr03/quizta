import { useSupabase } from "../config.js";
import { createLocalStorage } from "./local.js";
import { createSupabaseStorage } from "./supabase.js";

/**
 * storage.put(key, buffer, contentType) / storage.remove(keys) / storage.publicUrl(key)
 * DB chỉ lưu "key" (vd: images/abc.webp), URL được tính khi trả về client.
 */
export const storage = useSupabase ? createSupabaseStorage() : createLocalStorage();

export const urlOf = (key) => (key ? storage.publicUrl(key) : null);

/** Xoá file nhưng không làm hỏng request nếu lỗi. */
export async function removeQuietly(keys) {
  const list = keys.filter(Boolean);
  if (!list.length) return;
  try {
    await storage.remove(list);
  } catch (err) {
    console.warn("Không xoá được file:", err.message);
  }
}
