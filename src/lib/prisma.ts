import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

// Next.js dev server reloads modules on every edit. Without this, each reload
// opens a fresh pool and the database runs out of connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and put your Supabase connection string in it.",
    );
  }
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      // Supabase's pooler closes connections it considers idle. A pool that
      // holds them longer than the server does will eventually hand out a dead
      // socket, which surfaces as "Can't reach database server" on a page that
      // worked minutes earlier — after a laptop sleeps, for instance. Letting
      // go first is cheaper than reconnecting mid-request.
      idleTimeoutMillis: 10_000,
      keepAlive: true,
      // Small on purpose: the free pooler has few slots, and this app serves
      // one office, not a public site.
      max: 5,
      // Fail with a real error instead of hanging a page for a minute.
      connectionTimeoutMillis: 15_000,
    }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
