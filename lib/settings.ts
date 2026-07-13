import { prisma } from "@/lib/prisma";

export async function getSettings() {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  return settings;
}

// Shift times (e.g. "09:00") are always office-local wall-clock time, but the
// Node process may run in a different timezone (production runs in UTC).
// All office-hours math must go through this zone rather than server-local time.
export const OFFICE_TIMEZONE = "Asia/Kolkata";

function zonedParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

// Converts wall-clock components in `timeZone` to the real UTC instant they represent.
function zonedTimeToUtc(
  y: number,
  monthIdx: number,
  d: number,
  hh: number,
  mm: number,
  ss: number,
  timeZone: string
) {
  // Offset (ms) of `timeZone` from UTC, measured near the target instant.
  const reference = new Date(Date.UTC(y, monthIdx, d, hh, mm, ss));
  const zoned = zonedParts(reference, timeZone);
  const zonedAsUTC = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
  const offsetMs = zonedAsUTC - reference.getTime();
  return new Date(Date.UTC(y, monthIdx, d, hh, mm, ss) - offsetMs);
}

export function computeLateMinutes(checkInAt: Date, shiftStart: string, graceMinutes: number) {
  const [h, m] = shiftStart.split(":").map(Number);
  const { year, month, day } = zonedParts(checkInAt, OFFICE_TIMEZONE);
  const deadline = zonedTimeToUtc(year, month - 1, day, h, m + graceMinutes, 0, OFFICE_TIMEZONE);
  const diffMs = checkInAt.getTime() - deadline.getTime();
  return diffMs > 0 ? Math.ceil(diffMs / 60000) : 0;
}

// Start of the office-local calendar day (in OFFICE_TIMEZONE) that `d` falls in,
// expressed as the equivalent UTC instant — so day-bucketing stays correct
// regardless of the server process's own timezone.
export function startOfDay(d: Date) {
  const { year, month, day } = zonedParts(d, OFFICE_TIMEZONE);
  return zonedTimeToUtc(year, month - 1, day, 0, 0, 0, OFFICE_TIMEZONE);
}

export function getClientIP(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

function ipToBits(ip: string): number[] | null {
  if (ip.includes(".") && !ip.includes(":")) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
    return parts.flatMap((p) => [128, 64, 32, 16, 8, 4, 2, 1].map((bit) => (p & bit ? 1 : 0)));
  }
  // IPv6: expand :: and hex groups into 128 bits
  const sides = ip.split("::");
  if (sides.length > 2) return null;
  const parseGroups = (s: string) => (s ? s.split(":") : []);
  const head = parseGroups(sides[0]);
  const tail = sides.length === 2 ? parseGroups(sides[1]) : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 0) return null;
  const groups = [...head, ...Array(sides.length === 2 ? missing : 0).fill("0"), ...tail];
  if (groups.length !== 8) return null;
  const bits: number[] = [];
  for (const g of groups) {
    const val = parseInt(g || "0", 16);
    if (Number.isNaN(val) || val < 0 || val > 0xffff) return null;
    for (let i = 15; i >= 0; i--) bits.push((val >> i) & 1);
  }
  return bits;
}

function matchesEntry(clientIP: string, entry: string): boolean {
  const [addr, prefixStr] = entry.split("/");
  const clientBits = ipToBits(clientIP);
  const entryBits = ipToBits(addr);
  if (!clientBits || !entryBits || clientBits.length !== entryBits.length) {
    return clientIP === entry;
  }
  const prefixLen = prefixStr ? parseInt(prefixStr, 10) : clientBits.length;
  if (Number.isNaN(prefixLen) || prefixLen < 0 || prefixLen > clientBits.length) return false;
  for (let i = 0; i < prefixLen; i++) {
    if (clientBits[i] !== entryBits[i]) return false;
  }
  return true;
}

// Suggests the office-IP entry that would allow the given client address:
// IPv4 → the exact address; IPv6 → the whole /64 network, because devices
// on the same WiFi rotate their host suffix but share the /64 prefix.
export function suggestOfficeEntry(clientIP: string | null): string | null {
  if (!clientIP) return null;
  if (!clientIP.includes(":")) return clientIP;
  const sides = clientIP.split("::");
  if (sides.length > 2) return null;
  const head = sides[0] ? sides[0].split(":") : [];
  const tail = sides.length === 2 && sides[1] ? sides[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 0) return null;
  const groups = [...head, ...Array(sides.length === 2 ? missing : 0).fill("0"), ...tail];
  if (groups.length !== 8) return null;
  return groups.slice(0, 4).map((g) => g || "0").join(":") + "::/64";
}

// officeIP can hold multiple comma-separated entries: exact IPv4/IPv6
// addresses, or CIDR ranges (e.g. "2405:201:5502:c32c::/64") since the
// same office network can present a different host address per device
// (especially over IPv6) while staying within the same network prefix.
export function isOnOfficeNetwork(clientIP: string | null, officeIP: string) {
  if (!clientIP) return false;
  const allowed = officeIP.split(",").map((ip) => ip.trim()).filter(Boolean);
  return allowed.some((entry) => matchesEntry(clientIP, entry));
}
