import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const next = process.platform === "win32" ? "next.cmd" : "next";
const child = spawn(next, ["start", "-H", "0.0.0.0", "-p", port], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
