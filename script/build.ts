import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, mkdir, readFile, readdir } from "fs/promises";


const allowlist = [
  "@google/generative-ai", "axios", "connect-pg-simple", "cors", "date-fns",
  "drizzle-orm", "drizzle-zod", "express", "express-rate-limit",
  "express-session", "jsonwebtoken", "memorystore", "multer", "nanoid",
  "nodemailer", "openai", "passport", "passport-local", "stripe", "uuid",
  "ws", "xlsx", "zod", "zod-validation-error", "serve-static", "fs", "path"
];

async function buildAll() {
  // Clean dist
  await rm("dist", { recursive: true, force: true });

  console.log("Building client...");
  // Use default Vite output (dist)
  await viteBuild();

  // Check what Vite actually created
  const viteDist = await readdir("dist").catch(() => []);
  console.log("Vite created:", viteDist);

  console.log("Building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];
  const externals = allDeps.filter(dep => !allowlist.includes(dep));

  await mkdir("dist", { recursive: true });
  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("✅ Build complete!");
  console.log("Run: node dist/index.cjs");
  console.log("Check: ls dist/");
}

buildAll().catch(err => {
  console.error(err);
  process.exit(1);
});
