import { Router } from "express";
import { stats } from "../controllers/dashboardController.js";
import { auth } from "../middleware/auth.js";
const router = Router();
router.get("/stats", auth, stats);
export default router;
