import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/settings";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "today";

  let where = {};
  if (scope === "today") {
    where = { date: startOfDay(new Date()) };
  } else if (scope === "month") {
    const since = new Date();
    since.setDate(1);
    where = { date: { gte: startOfDay(since) } };
  }

  const records = await prisma.attendance.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, department: true, jobTitle: true, branch: true, employeeCode: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ records });
}
