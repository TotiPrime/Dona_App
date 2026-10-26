import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "frontend/dist");
await fs.cp(path.join(dist, "assets"), path.join(root, "assets"), {
  recursive: true,
});
await fs.copyFile(path.join(dist, "index.html"), path.join(root, "index.html"));
await fs.writeFile(path.join(root, ".nojekyll"), "");
console.log("Sitio listo en la raíz del proyecto.");
