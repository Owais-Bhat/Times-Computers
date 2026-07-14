import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const leave = await prisma.leave.findUnique({ where: { id } });
  if (!leave) return NextResponse.json({ error: "Leave not found" }, { status: 404 });

  await prisma.leave.update({ where: { id }, data: { status: parsed.data.status } });

  return NextResponse.json({ ok: true });
}
