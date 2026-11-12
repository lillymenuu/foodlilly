import { defineConfig } from "drizzle-kit";

// O drizzle-kit não lê o .env.local sozinho (o Next.js lê, ele não).
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sem .env.local (ex.: CI/Vercel): usa as variáveis já definidas no ambiente.
}

// Migrations usam a conexão direta (sem pgbouncer) quando disponível.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("Defina DATABASE_URL (ou DATABASE_URL_UNPOOLED) em .env.local.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
