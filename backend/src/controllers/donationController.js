import { all, get, run } from "../config/db.js";
import fs from "node:fs/promises";
export const transitions = {
  registrada: ["aprobada", "rechazada"],
  aprobada: ["entregada", "rechazada"],
  entregada: [],
  rechazada: [],
};
export function scope(user, alias = "d") {
  if (user.rol === "admin") return { sql: "1=1", params: [] };
  if (user.rol === "orfanato")
    return {
      sql: `${alias}.orphanage_id IN (SELECT id FROM orphanages WHERE user_id=?)`,
      params: [user.id],
    };
  return { sql: `${alias}.donor_id=?`, params: [user.id] };
}
export async function listDonations(req, res) {
  const s = scope(req.user);
  res.json(
    await all(
      `SELECT d.*,u.nombre donor_nombre,o.nombre orphanage_nombre FROM donations d LEFT JOIN users u ON u.id=d.donor_id LEFT JOIN orphanages o ON o.id=d.orphanage_id WHERE ${s.sql} ORDER BY d.id DESC`,
      s.params,
    ),
  );
}
export async function history(req, res) {
  const s = scope(req.user);
  if (
    !(await get(`SELECT d.id FROM donations d WHERE d.id=? AND ${s.sql}`, [
      req.params.id,
      ...s.params,
    ]))
  )
    return res.status(404).json({ message: "Donación no encontrada" });
  res.json(
    await all(
      "SELECT estado,nota,created_at FROM donation_events WHERE donation_id=? ORDER BY id",
      [req.params.id],
    ),
  );
}
export async function createDonation(req, res) {
  const reject = async (message) => {
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ message });
  };
  const { orphanage_id, need_id, tipo, descripcion, cantidad } = req.body;
  if (
    ![
      "Ropa",
      "Alimentos",
      "Útiles escolares",
      "Juguetes",
      "Higiene",
      "Otros",
    ].includes(tipo)
  )
    return reject("Selecciona un tipo válido");
  if (
    !Number.isInteger(Number(cantidad)) ||
    Number(cantidad) < 1 ||
    Number(cantidad) > 100000
  )
    return reject("La cantidad debe ser un entero entre 1 y 100000");
  if (!descripcion?.trim() || descripcion.length > 1000)
    return reject("Describe tu aporte (máximo 1000 caracteres)");
  if (!(await get("SELECT id FROM orphanages WHERE id=?", [orphanage_id])))
    return reject("Selecciona una organización existente");
  if (need_id) {
    const need = await get("SELECT * FROM needs WHERE id=?", [need_id]);
    if (
      !need ||
      need.orphanage_id !== Number(orphanage_id) ||
      need.tipo !== tipo ||
      need.estado !== "pendiente"
    )
      return reject(
        "La necesidad debe estar pendiente y coincidir con la organización y tipo",
      );
  }
  const result = await run(
    `INSERT INTO donations(donor_id,orphanage_id,need_id,tipo,descripcion,cantidad,image_url,ai_condition,ai_recommendation) VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      req.user.id,
      orphanage_id,
      need_id || null,
      tipo,
      descripcion.trim(),
      Number(cantidad),
      req.file ? `/uploads/${req.file.filename}` : null,
      "Revisión manual",
      "El equipo verificará el estado y la cantidad al recibir el aporte.",
    ],
  );
  await run(
    "INSERT INTO donation_events(donation_id,estado,actor_id,nota) VALUES (?,?,?,?)",
    [
      result.lastID,
      "registrada",
      req.user.id,
      "Aporte registrado; aún no confirma recepción.",
    ],
  );
  res
    .status(201)
    .json(await get("SELECT * FROM donations WHERE id=?", [result.lastID]));
}
export async function updateDonationStatus(req, res) {
  const s = scope(req.user);
  const row = await get(
    `SELECT d.* FROM donations d WHERE d.id=? AND ${s.sql}`,
    [req.params.id, ...s.params],
  );
  if (!row) return res.status(404).json({ message: "Donación no encontrada" });
  const { estado, nota = "" } = req.body;
  if (!transitions[row.estado]?.includes(estado))
    return res
      .status(400)
      .json({
        message:
          "Transición inválida. Registra → aprueba → entrega, o rechaza antes de entregar.",
      });
  if (typeof nota !== "string" || nota.length > 500)
    return res
      .status(400)
      .json({ message: "La observación admite hasta 500 caracteres" });
  if (estado === "rechazada" && !nota.trim())
    return res.status(400).json({ message: "Explica el motivo del rechazo" });
  // Compare-and-swap evita duplicar eventos con dos peticiones simultáneas.
  const updated = await run(
    "UPDATE donations SET estado=? WHERE id=? AND estado=?",
    [estado, row.id, row.estado],
  );
  if (!updated.changes)
    return res
      .status(409)
      .json({ message: "El estado cambió. Actualiza el panel." });
  await run(
    "INSERT INTO donation_events(donation_id,estado,actor_id,nota) VALUES (?,?,?,?)",
    [
      row.id,
      estado,
      req.user.id,
      nota.trim() || "Estado actualizado por coordinación.",
    ],
  );
  res.json(await get("SELECT * FROM donations WHERE id=?", [row.id]));
}
