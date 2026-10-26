import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
export const uploadDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../uploads",
);
fs.mkdirSync(uploadDir, { recursive: true });
const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
export const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) =>
      cb(null, randomUUID() + extensions[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    extensions[file.mimetype]
      ? cb(null, true)
      : cb(new Error("Solo imágenes JPG, PNG o WebP de hasta 5 MB")),
});
