import { all, get, run } from "../config/db.js";
export async function listNeeds(_req, res) {
  res.json(
    await all(
      `SELECT n.*,o.nombre orphanage_nombre,o.categoria,COALESCE((SELECT SUM(d.cantidad) FROM donations d WHERE d.need_id=n.id AND d.estado='entregada'),0) recibidas FROM needs n JOIN orphanages o ON o.id=n.orphanage_id ORDER BY CASE n.prioridad WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,n.id DESC`,
    ),
  );
}
export async function createNeed(req, res) {
  const {
    orphanage_id,
    tipo,
    descripcion,
    edad = "",
    talla = "",
    cantidad,
    prioridad = "media",
  } = req.body;
  if (
    ![
      "Ropa",
      "Alimentos",
      "Útiles escolares",
      "Juguetes",
      "Higiene",
      "Otros",
    ].includes(tipo) ||
    !descripcion?.trim() ||
    descripcion.length > 1000 ||
    !Number.isInteger(Number(cantidad)) ||
    Number(cantidad) < 1 ||
    Number(cantidad) > 100000 ||
    !["baja", "media", "alta"].includes(prioridad)
  )
    return res
      .status(400)
      .json({ message: "Revisa tipo, descripción, cantidad y prioridad" });
  if (!(await get("SELECT id FROM orphanages WHERE id=?", [orphanage_id])))
    return res.status(400).json({ message: "Organización no encontrada" });
  const r = await run(
    "INSERT INTO needs(orphanage_id,tipo,descripcion,edad,talla,cantidad,prioridad) VALUES (?,?,?,?,?,?,?)",
    [
      orphanage_id,
      tipo,
      descripcion.trim(),
      edad,
      talla,
      Number(cantidad),
      prioridad,
    ],
  );
  res.status(201).json(await get("SELECT * FROM needs WHERE id=?", [r.lastID]));
}
export async function updateNeedStatus(req, res) {
  if (!["pendiente", "cubierta"].includes(req.body.estado))
    return res.status(400).json({ message: "Estado inválido" });
  const r = await run("UPDATE needs SET estado=? WHERE id=?", [
    req.body.estado,
    req.params.id,
  ]);
  if (!r.changes)
    return res.status(404).json({ message: "Necesidad no encontrada" });
  res.json(await get("SELECT * FROM needs WHERE id=?", [req.params.id]));
}
