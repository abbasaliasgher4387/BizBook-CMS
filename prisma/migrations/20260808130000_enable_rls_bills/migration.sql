-- Same reasoning as 20260807230000_enable_rls, for the three tables the Bills
-- module adds: RLS on, no policies, so Supabase's public REST API can reach
-- nothing while Prisma (connecting as `postgres`, which has BYPASSRLS) is
-- unaffected. A no-op on a plain local Postgres.

ALTER TABLE "Bill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillCharge" ENABLE ROW LEVEL SECURITY;
