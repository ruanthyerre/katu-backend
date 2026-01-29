import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createProfessional(req: Request, res: Response) {
  try {
    const data: any = req.body;
    const prof = await prisma.professional.create({ data });
    res.status(201).json(prof);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function listProfessionals(req: Request, res: Response) {
  try {
    const items = await prisma.professional.findMany({ orderBy: { createdAt: "desc" } as any });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function getProfessional(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const p = await prisma.professional.findUnique({ where: { id } });
    if (!p) return res.status(404).json({ error: "not_found" });
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function updateProfessional(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: any = req.body;
    const updated = await prisma.professional.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function deleteProfessional(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.professional.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}
