import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = startOfDay(new Date());
  since.setDate(since.getDate() - 13);

  const records = await prisma.attendance.findMany({
    where: { userId: session.user.id, date: { gte: since } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ records });
}
