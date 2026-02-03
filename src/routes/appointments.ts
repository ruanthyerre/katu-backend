import { Router } from "express";
import {
  createAppointment,
  listAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentsController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAuth); // all appointment endpoints require auth

router.post("/", createAppointment);
router.get("/", listAppointments);
router.get("/:id", getAppointment);
router.patch("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

export default router;
