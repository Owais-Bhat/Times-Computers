import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const leaves = await prisma.leave.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, department: true } } },
  });

  return NextResponse.json({
    leaves: leaves.map((l) => ({
      id: l.id,
      userId: l.userId,
      userName: l.user.name,
      userDept: l.user.department,
      type: l.type,
      fromDate: l.fromDate,
      toDate: l.toDate,
      reason: l.reason,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
