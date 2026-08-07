# Bizbook

Quotations for a Karachi supplier that trades under seven registered companies.
Each company prints on its own letterhead design; everything else — customers,
products, numbering — is shared. Next.js 16, Prisma 7, PostgreSQL.

## Running it locally

Development runs against Postgres **on this machine**, not Supabase. Supabase is
a free nano instance in Singapore and the sockets it drops mid-page make local
work miserable; the local database is also safe to wipe.

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL and AUTH_SECRET
npx prisma migrate deploy     # create the tables
npx prisma db seed            # demo companies, customers, products, quotations
npm run dev
```

Sign in with `administrator` / `admin123` — that account is created on the first
visit to `/login` when the user table is empty, and never again.

### Postgres is not a Windows service here

It does not start with the machine. If a page says *"Can't reach database server
at localhost:5432"*, start it:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D 'C:\Program Files\PostgreSQL\18\data' -w start
```

Look at the data with **pgAdmin 4** (installed alongside Postgres), or with
`npx prisma studio`, which opens the same rows on http://localhost:5555 without
any SQL.

## Environment

| File | Read by | Points at |
|---|---|---|
| `.env` | `next dev` **and every `prisma` CLI command** | local `bizbook_dev` |
| `.env.production` | `next build` / `next start` | Supabase |

Both are gitignored. The Prisma CLI never reads `.env.production`, so a command
meant for the live database has to say so for that one command:

```powershell
$env:DATABASE_URL="<supabase-uri>"; npx prisma migrate deploy; $env:DATABASE_URL=$null
```

## Deploying

Vercel builds with `npm run build`, which runs `prisma generate` first — the
generated client lives in `/generated` and is deliberately not committed.

Set `DATABASE_URL` and `AUTH_SECRET` in the Vercel project's environment
variables. Without `AUTH_SECRET` the app refuses to start in production rather
than sign cookies with a value anyone could read off GitHub.
