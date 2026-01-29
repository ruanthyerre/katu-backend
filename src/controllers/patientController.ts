```typescript name=src/controllers/patientController.ts url=https://github.com/ruanthyerre/katu-backend/blob/main/src/controllers/patientController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createPatient(req: Request, res: Response) {
  try {
    const data: any = req.body;
    const patient = await prisma.patient.create({ data });
    res.status(201).json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function listPatients(req: Request, res: Response) {
  try {
    const q = (req.query.query as string) || "";
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20", 10)));
    const offset = Math.max(0, parseInt((req.query.offset as string) || "0", 10));

    const where: any = {};
    if (q && q.length >= 1) {
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { cpf: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where,
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function getPatient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const p = await prisma.patient.findUnique({ where: { id }, include: { user: { select: { id: true, email: true, name: true } } } });
    if (!p) return res.status(404).json({ error: "not_found" });
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function updatePatient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: any = req.body;
    const updated = await prisma.patient.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function deletePatient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.patient.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}
