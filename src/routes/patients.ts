import { Router } from "express";
import {
  createPatient,
  listPatients,
  getPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/", requireAuth, listPatients);
router.post("/", requireAuth, createPatient);
router.get("/:id", requireAuth, getPatient);
router.patch("/:id", requireAuth, updatePatient);
router.delete("/:id", requireAuth, deletePatient);

export default router;
