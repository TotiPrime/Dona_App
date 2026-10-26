import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import orphanageRoutes from "./routes/orphanageRoutes.js";
import needRoutes from "./routes/needRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { uploadDir } from "./config/upload.js";
import { auth } from "./middleware/auth.js";
import { get } from "./config/db.js";
import { scope } from "./controllers/donationController.js";
import path from "node:path";
export const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
// Express 4: todos los handlers async pasan sus errores al middleware final.
const wrapRouter = (router) => {
  for (const layer of router.stack) {
    if (layer.route)
      for (const item of layer.route.stack) {
        const handler = item.handle;
        if (handler.constructor.name === "AsyncFunction")
          item.handle = (req, res, next) =>
            Promise.resolve(handler(req, res, next)).catch(next);
      }
  }
  return router;
};
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", demo: process.env.DEMO_DATA === "true" }),
);
app.get("/uploads/:filename", auth, async (req, res, next) => {
  try {
    const s = scope(req.user);
    const row = await get(
      `SELECT d.id FROM donations d WHERE image_url=? AND ${s.sql}`,
      ["/uploads/" + req.params.filename, ...s.params],
    );
    if (!row) return res.status(404).json({ message: "Imagen no encontrada" });
    res.sendFile(path.join(uploadDir, path.basename(req.params.filename)));
  } catch (e) {
    next(e);
  }
});
app.use("/api/auth", wrapRouter(authRoutes));
app.use("/api/orphanages", wrapRouter(orphanageRoutes));
app.use("/api/needs", wrapRouter(needRoutes));
app.use("/api/donations", wrapRouter(donationRoutes));
app.use("/api/dashboard", wrapRouter(dashboardRoutes));
app.use((_req, res) => res.status(404).json({ message: "Ruta no encontrada" }));
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res
    .status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400)
    .json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "La imagen supera 5 MB"
          : "No se pudo procesar la solicitud. Revisa los datos o el archivo.",
    });
});
await initDb();
if (process.env.NODE_ENV !== "test")
  app.listen(process.env.PORT || 4000, () =>
    console.log("DonaApp API lista en puerto " + (process.env.PORT || 4000)),
  );
