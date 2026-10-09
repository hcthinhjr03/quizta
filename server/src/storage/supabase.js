import { config } from "../config.js";
import { getSupabase } from "../supabase.js";

export function createSupabaseStorage() {
  const bucket = () => getSupabase().storage.from(config.supabaseBucket);
  return {
    kind: "supabase",
    async put(key, buffer, contentType) {
      const { error } = await bucket().upload(key, buffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw new Error(`Upload Supabase thất bại: ${error.message}`);
    },
    async remove(keys) {
      if (!keys.length) return;
      const { error } = await bucket().remove(keys);
      if (error) console.warn("Không xoá được file trên Supabase:", error.message);
    },
    publicUrl: (key) => bucket().getPublicUrl(key).data.publicUrl,
  };
}
