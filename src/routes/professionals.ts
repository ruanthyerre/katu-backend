import { Router } from "express";
import {
  createProfessional,
  listProfessionals,
  getProfessional,
  updateProfessional,
  deleteProfessional,
} from "../controllers/professionalController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/", requireAuth, listProfessionals);
router.post("/", requireAuth, createProfessional);
router.get("/:id", requireAuth, getProfessional);
router.patch("/:id", requireAuth, updateProfessional);
router.delete("/:id", requireAuth, deleteProfessional);

export default router;
