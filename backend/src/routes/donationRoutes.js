import { Router } from "express";
import {
  createDonation,
  listDonations,
  updateDonationStatus,
  history,
} from "../controllers/donationController.js";
import { auth, role } from "../middleware/auth.js";
import { upload } from "../config/upload.js";
const router = Router();
router.get("/", auth, listDonations);
router.get("/:id/history", auth, history);
router.post(
  "/",
  auth,
  role("donante", "admin"),
  upload.single("imagen"),
  createDonation,
);
router.patch(
  "/:id/status",
  auth,
  role("admin", "orfanato"),
  updateDonationStatus,
);
export default router;
