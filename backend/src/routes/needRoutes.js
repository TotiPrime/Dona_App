import { Router } from "express";
import {
  createNeed,
  listNeeds,
  updateNeedStatus,
} from "../controllers/needController.js";
import { auth, role } from "../middleware/auth.js";
const router = Router();
router.get("/", listNeeds);
router.post("/", auth, role("admin"), createNeed);
router.patch("/:id/status", auth, role("admin"), updateNeedStatus);
export default router;
