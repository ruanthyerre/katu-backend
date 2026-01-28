import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createPatient(req: Request, res: Response) {
  try {
    // accept any fields; cast to any to avoid strict schema typing issues
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
    const patients = await prisma.patient.findMany({ orderBy: { createdAt: "desc" } as any });
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function getPatient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const p = await prisma.patient.findUnique({ where: { id } });
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
