import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createLeaveSchema = z.object({
  type: z.string().min(1).max(100),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  reason: z.string().max(1000).default(""),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leaves = await prisma.leave.findMany({
    where: { userId: session.user.id },
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

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createLeaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { type, fromDate, toDate, reason } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, department: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const leave = await prisma.leave.create({
    data: { userId: session.user.id, type, fromDate, toDate, reason },
  });

  return NextResponse.json({
    leave: {
      id: leave.id,
      userId: leave.userId,
      userName: user.name,
      userDept: user.department,
      type: leave.type,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      reason: leave.reason,
      status: leave.status,
      createdAt: leave.createdAt.toISOString(),
    },
  }, { status: 201 });
}
