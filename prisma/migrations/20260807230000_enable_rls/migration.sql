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
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
