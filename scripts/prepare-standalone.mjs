import { cpSync, existsSync, mkdirSync } from "node:fs";

const standaloneDir = ".next/standalone";
const standaloneStaticDir = ".next/standalone/.next";

if (!existsSync(standaloneDir) || !existsSync(".next/static")) {
  console.error("Standalone build output not found. Run `next build` first.");
  process.exit(1);
}

mkdirSync(standaloneStaticDir, { recursive: true });
cpSync("public", `${standaloneDir}/public`, { recursive: true });
cpSync(".next/static", `${standaloneStaticDir}/static`, { recursive: true });
