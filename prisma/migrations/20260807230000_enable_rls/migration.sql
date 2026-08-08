-- Supabase exposes every public table over its REST API (PostgREST) to anyone
-- holding the project's anon key, which is public by design. This app never uses
-- that API — it talks to Postgres directly through Prisma — so the correct
-- setting is RLS on with no policies at all: PostgREST can reach nothing.
--
-- Prisma is unaffected. It connects as `postgres`, which has BYPASSRLS, so these
-- tables keep behaving exactly as before for the app.
--
-- On a plain local Postgres this is a harmless no-op for the same reason.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quotation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuotationItem" ENABLE ROW LEVEL SECURITY;

-- Prisma's own bookkeeping table, guarded because it is the one table here that
-- is not always present when this runs: on the shadow database Prisma builds to
-- plan a new migration, the history table does not exist yet, and a bare ALTER
-- aborts every future `migrate dev` with "relation does not exist".
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
