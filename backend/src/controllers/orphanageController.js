import { all, get, run } from "../config/db.js";
const valid = (b) =>
  typeof b.nombre === "string" &&
  b.nombre.trim().length >= 3 &&
  b.nombre.length <= 120 &&
  ["Infancia", "Animales", "Comunidad"].includes(b.categoria || "Infancia") &&
  Number.isInteger(Number(b.capacidad || 0)) &&
  Number(b.capacidad || 0) >= 0;
export async function listOrphanages(_req, res) {
  res.json(
    await all(
      "SELECT id,nombre,direccion,telefono,responsable,descripcion,capacidad,categoria,created_at FROM orphanages ORDER BY id",
    ),
  );
}
export async function getOrphanage(req, res) {
  const row = await get(
    "SELECT id,nombre,direccion,telefono,responsable,descripcion,capacidad,categoria FROM orphanages WHERE id=?",
    [req.params.id],
  );
  if (!row)
    return res.status(404).json({ message: "Organización no encontrada" });
  res.json(row);
}
function values(b) {
  return [
    b.nombre.trim(),
    b.direccion || "",
    b.telefono || "",
    b.responsable || "",
    b.descripcion || "",
    Number(b.capacidad || 0),
    b.categoria || "Infancia",
  ];
}
export async function createOrphanage(req, res) {
  if (!valid(req.body))
    return res
      .status(400)
      .json({ message: "Revisa nombre, categoría y capacidad" });
  const r = await run(
    "INSERT INTO orphanages(nombre,direccion,telefono,responsable,descripcion,capacidad,categoria) VALUES (?,?,?,?,?,?,?)",
    values(req.body),
  );
  res
    .status(201)
    .json(await get("SELECT * FROM orphanages WHERE id=?", [r.lastID]));
}
export async function updateOrphanage(req, res) {
  if (!valid(req.body))
    return res
      .status(400)
      .json({ message: "Revisa nombre, categoría y capacidad" });
  const r = await run(
    "UPDATE orphanages SET nombre=?,direccion=?,telefono=?,responsable=?,descripcion=?,capacidad=?,categoria=? WHERE id=?",
    [...values(req.body), req.params.id],
  );
  if (!r.changes)
    return res.status(404).json({ message: "Organización no encontrada" });
  res.json(await get("SELECT * FROM orphanages WHERE id=?", [req.params.id]));
}
export async function deleteOrphanage(req, res) {
  if (
    await get(
      "SELECT id FROM donations WHERE orphanage_id=? UNION SELECT id FROM needs WHERE orphanage_id=? LIMIT 1",
      [req.params.id, req.params.id],
    )
  )
    return res
      .status(409)
      .json({
        message:
          "Tiene necesidades o donaciones asociadas; conserva su trazabilidad.",
      });
  const r = await run("DELETE FROM orphanages WHERE id=?", [req.params.id]);
  if (!r.changes)
    return res.status(404).json({ message: "Organización no encontrada" });
  res.json({ message: "Organización eliminada" });
}
