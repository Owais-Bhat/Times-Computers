import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@timescomputers.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log("Admin user already exists:", adminEmail);
    return;
  }

  const passwordHash = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.create({
    data: {
      name: "System Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      department: "Management",
      jobTitle: "Administrator",
    },
  });

  console.log("Seeded admin user:");
  console.log("  email:", adminEmail);
  console.log("  password: Admin@12345");
  console.log("  IMPORTANT: log in and this should be rotated in a real deployment.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
