import { get, all } from "../config/db.js";
import { scope } from "./donationController.js";
export async function stats(req, res) {
  const s = scope(req.user);
  const summary = await get(
    `SELECT COUNT(*) donations,COALESCE(SUM(estado='registrada'),0) pendingDonations,COALESCE(SUM(estado='entregada'),0) delivered,COALESCE(SUM(CASE WHEN estado='entregada' THEN cantidad ELSE 0 END),0) units FROM donations d WHERE ${s.sql}`,
    s.params,
  );
  const byType = await all(
    `SELECT tipo,COUNT(*) total FROM donations d WHERE ${s.sql} GROUP BY tipo ORDER BY total DESC`,
    s.params,
  );
  res.json({
    ...summary,
    orphanages: (await get("SELECT COUNT(*) total FROM orphanages")).total,
    pendingNeeds: (
      await get("SELECT COUNT(*) total FROM needs WHERE estado='pendiente'")
    ).total,
    byType,
  });
}
