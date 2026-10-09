// Chạy song song server (Express) và client (Vite) khi dev: `npm run dev`.
import { spawn } from "node:child_process";

const tasks = [
  { name: "server", color: "\x1b[34m", workspace: "server" },
  { name: "client", color: "\x1b[32m", workspace: "client" },
];

const children = tasks.map(({ name, color, workspace }) => {
  const child = spawn("npm", ["run", "dev", "-w", workspace], { shell: true, env: process.env });
  const prefix = `${color}[${name}]\x1b[0m `;
  const pipe = (stream, out) =>
    stream.on("data", (buf) => {
      for (const line of buf.toString().split(/\r?\n/)) if (line) out.write(prefix + line + "\n");
    });
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on("exit", (code) => {
    console.log(`${prefix}đã dừng (code ${code})`);
    shutdown(code ?? 0);
  });
  return child;
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const c of children) if (c.exitCode === null) c.kill();
  setTimeout(() => process.exit(code), 300);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
