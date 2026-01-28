import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import appointmentsRoutes from "./routes/appointments";
import patientsRoutes from "./routes/patients";
import professionalsRoutes from "./routes/professionals";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "./middleware/authMiddleware";

dotenv.config();
const app = express();
app.use(express.json());

const prisma = new PrismaClient();

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "katu-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/professionals", professionalsRoutes);

// Protected example: current user
app.get("/api/me", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "unauthenticated" });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return res.status(404).json({ error: "not_found" });
  res.json(user);
});

// Basic error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Katu backend listening on ${port}`);
});
