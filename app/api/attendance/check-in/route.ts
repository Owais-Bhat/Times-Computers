import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettings, computeLateMinutes, startOfDay, getClientIP, isOnOfficeNetwork } from "@/lib/settings";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = startOfDay(new Date());
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });
  if (existing?.checkInAt) {
    return NextResponse.json({ error: "Already checked in today" }, { status: 409 });
  }

  const settings = await getSettings();
  const clientIP = getClientIP(req);
  if (!isOnOfficeNetwork(clientIP, settings.officeIP)) {
    return NextResponse.json(
      { error: `You must be connected to the office network to check in (detected IP: ${clientIP ?? "unknown"}, expected: ${settings.officeIP})` },
      { status: 403 }
    );
  }

  const now = new Date();
  const lateMinutes = computeLateMinutes(now, settings.shiftStart, settings.graceMinutes);
  const status = lateMinutes > 0 ? "LATE" : "PRESENT";

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  const attendance = await prisma.attendance.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    update: { checkInAt: now, status, lateMinutes, branch: user?.branch, selfMarked: true },
    create: {
      userId: session.user.id,
      date: today,
      checkInAt: now,
      status,
      lateMinutes,
      branch: user?.branch,
      selfMarked: true,
    },
  });

  return NextResponse.json({ attendance });
}
