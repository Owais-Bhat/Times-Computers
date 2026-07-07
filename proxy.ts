import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");
  if (isAdminApi) {
    const role = req.auth?.user?.role;
    if (!req.auth || role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/api/admin/:path*"],
};
