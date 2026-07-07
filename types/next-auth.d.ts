import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "EMPLOYEE";
    department: string;
    jobTitle: string;
  }
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EMPLOYEE";
      department: string;
      jobTitle: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "EMPLOYEE";
    department: string;
    jobTitle: string;
  }
}
