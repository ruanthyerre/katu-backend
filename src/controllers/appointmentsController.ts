import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Helper: check overlap for given professionalId or patientId.
 * Returns true if there is a conflicting appointment (excluding optional excludeId).
 */
async function hasOverlap({ professionalId, patientId, startAt, endAt, excludeId }: {
  professionalId?: string | null;
  patientId?: string | null;
  startAt: string;
  endAt: string;
  excludeId?: string | null;
}) {
  const clauses: any[] = [];

  if (professionalId) {
    clauses.push({
      professionalId,
      AND: [
        { startAt: { lt: new Date(endAt) } },
        { endAt: { gt: new Date(startAt) } },
      ],
    });
  }
  if (patientId) {
    clauses.push({
      patientId,
      AND: [
        { startAt: { lt: new Date(endAt) } },
        { endAt: { gt: new Date(startAt) } },
      ],
    });
  }
  if (clauses.length === 0) return false;

  const where: any = {
    OR: clauses,
  };
  if (excludeId) {
    where.NOT = { id: excludeId };
  }
  const conflict = await prisma.appointment.findFirst({ where });
  return !!conflict;
}

export async function createAppointment(req: Request, res: Response) {
  try {
    const { professionalId = null, patientId = null, clinicId = null, type, startAt, endAt, status = "SCHEDULED" } = req.body;
    if (!startAt || !endAt || !type) return res.status(400).json({ error: "start_end_type_required" });

    // availability check
    const conflict = await hasOverlap({ professionalId, patientId, startAt, endAt });
    if (conflict) return res.status(409).json({ error: "time_conflict" });

    const appt = await prisma.appointment.create({
      data: {
        professionalId,
        patientId,
        clinicId,
        type,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        status,
      },
    });
    res.status(201).json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function listAppointments(req: Request, res: Response) {
  try {
    const { professionalId, patientId, date } = req.query as any;
    const where: any = {};
    if (professionalId) where.professionalId = professionalId;
    if (patientId) where.patientId = patientId;
    if (date) {
      // filter appointments that intersect the given day
      const dayStart = new Date(date);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.AND = [
        { startAt: { lt: dayEnd } },
        { endAt: { gt: dayStart } },
      ];
    }

    const appts = await prisma.appointment.findMany({ where, orderBy: { startAt: "asc" } });
    res.json(appts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function getAppointment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) return res.status(404).json({ error: "not_found" });
    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function updateAppointment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates: any = {};
    const allowed = ["professionalId","patientId","clinicId","type","startAt","endAt","status"];
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (updates.startAt) updates.startAt = new Date(updates.startAt);
    if (updates.endAt) updates.endAt = new Date(updates.endAt);

    // check conflict if times/professional/patient changed
    const apptBefore = await prisma.appointment.findUnique({ where: { id } });
    if (!apptBefore) return res.status(404).json({ error: "not_found" });

    const professionalId = updates.professionalId ?? apptBefore.professionalId;
    const patientId = updates.patientId ?? apptBefore.patientId;
    const startAt = updates.startAt ? updates.startAt.toISOString() : apptBefore.startAt.toISOString();
    const endAt = updates.endAt ? updates.endAt.toISOString() : apptBefore.endAt.toISOString();

    const conflict = await hasOverlap({ professionalId, patientId, startAt, endAt, excludeId: id });
    if (conflict) return res.status(409).json({ error: "time_conflict" });

    const updated = await prisma.appointment.update({ where: { id }, data: updates });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function deleteAppointment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.appointment.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
}
