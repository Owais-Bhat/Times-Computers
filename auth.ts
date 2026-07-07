import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email or Faculty ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier;
        const password = credentials?.password;
        if (typeof identifier !== "string" || typeof password !== "string" || !identifier || !password) {
          return null;
        }

        const trimmed = identifier.trim();
        const user = trimmed.includes("@")
          ? await prisma.user.findUnique({ where: { email: trimmed.toLowerCase() } })
          : await prisma.user.findUnique({ where: { employeeCode: trimmed } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          jobTitle: user.jobTitle,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.department = user.department;
        token.jobTitle = user.jobTitle;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "EMPLOYEE";
        session.user.department = token.department as string;
        session.user.jobTitle = token.jobTitle as string;
      }
      return session;
    },
  },
});
