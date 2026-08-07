import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // `npx prisma db seed`. Demo rows for a local database — see the file. It
    // reads DATABASE_URL like every other CLI command, so it fills whichever
    // database .env points at: keep .env local before running it.
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
