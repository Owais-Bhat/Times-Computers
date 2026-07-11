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
