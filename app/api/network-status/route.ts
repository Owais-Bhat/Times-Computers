import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSettings, getClientIP, isOnOfficeNetwork } from "@/lib/settings";

// Reports whether the calling device is currently on the office network,
// using the same detection the check-in endpoint enforces.
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getSettings();
  const detectedIP = getClientIP(req);
  const onNetwork = isOnOfficeNetwork(detectedIP, settings.officeIP);

  return NextResponse.json({ onNetwork, detectedIP });
}
