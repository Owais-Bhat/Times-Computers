import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettings, startOfDay, getClientIP } from "@/lib/settings";

const bodySchema = z.object({
  batchAssigned: z.string().trim().max(100).optional(),
  classesTaken: z.number().int().min(0).max(20).optional(),
  studentsPresent: z.number().int().min(0).max(2000).optional(),
  studentsAbsent: z.number().int().min(0).max(2000).optional(),
  breakMinutes: z.number().int().min(0).max(480).optional(),
  remarks: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const today = startOfDay(new Date());
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });
  if (!existing?.checkInAt) {
    return NextResponse.json({ error: "You must check in before checking out" }, { status: 400 });
  }
  if (existing.checkOutAt) {
    return NextResponse.json({ error: "Already checked out today" }, { status: 409 });
  }

  const settings = await getSettings();
  const clientIP = getClientIP(req);
  if (clientIP !== settings.officeIP) {
    return NextResponse.json(
      { error: "You must be connected to the office network to check out" },
      { status: 403 }
    );
  }

  const now = new Date();
  const totalWorkingHours = Math.round(((now.getTime() - existing.checkInAt.getTime()) / 3600000) * 100) / 100;

  const attendance = await prisma.attendance.update({
    where: { id: existing.id },
    data: { checkOutAt: now, totalWorkingHours, ...parsed.data },
  });

  return NextResponse.json({ attendance });
}
