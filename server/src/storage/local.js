import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

export const uploadsDir = path.join(config.localDataDir, "uploads");

export function createLocalStorage() {
  const fileOf = (key) => path.join(uploadsDir, ...key.split("/"));
  return {
    kind: "local",
    async put(key, buffer) {
      await fs.mkdir(path.dirname(fileOf(key)), { recursive: true });
      await fs.writeFile(fileOf(key), buffer);
    },
    async remove(keys) {
      await Promise.all(keys.map((k) => fs.rm(fileOf(k), { force: true })));
    },
    publicUrl: (key) => `/media/${key}`,
  };
}
