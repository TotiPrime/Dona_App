import { Router } from "express";
import {
  createOrphanage,
  deleteOrphanage,
  getOrphanage,
  listOrphanages,
  updateOrphanage,
} from "../controllers/orphanageController.js";
import { auth, role } from "../middleware/auth.js";
const router = Router();
router.get("/", listOrphanages);
router.get("/:id", getOrphanage);
router.post("/", auth, role("admin"), createOrphanage);
router.put("/:id", auth, role("admin"), updateOrphanage);
router.delete("/:id", auth, role("admin"), deleteOrphanage);
export default router;
