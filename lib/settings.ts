import { prisma } from "@/lib/prisma";

export async function getSettings() {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  return settings;
}

export function computeLateMinutes(checkInAt: Date, shiftStart: string, graceMinutes: number) {
  const [h, m] = shiftStart.split(":").map(Number);
  const deadline = new Date(checkInAt);
  deadline.setHours(h, m + graceMinutes, 0, 0);
  const diffMs = checkInAt.getTime() - deadline.getTime();
  return diffMs > 0 ? Math.ceil(diffMs / 60000) : 0;
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
