import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  remarks: z.string().trim().max(500).optional(),
  status: z.enum(["PRESENT", "LATE", "ABSENT", "LEAVE"]).optional(),
  branch: z.string().trim().max(100).optional(),
  approve: z.boolean().optional(),
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
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { approve, ...rest } = parsed.data;

  const attendance = await prisma.attendance.update({
    where: { id },
    data: {
      ...rest,
      ...(approve ? { approvedById: session.user.id } : {}),
    },
  });

  return NextResponse.json({ attendance });
}
