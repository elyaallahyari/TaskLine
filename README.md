-- Active: 1789709692255@@127.0.0.1@5432@postgres
# TaskLine

TaskLine is a portfolio task product: boards, a month calendar, and a real timeline. The stack is Next.js on the front, Nest.js on the API, and Postgres.

AI agents are left as a next step — the landing page says so, and the data model is ready for that later.

## Stack

- **Web:** Next.js, TypeScript, Tailwind CSS, shadcn-style UI, TanStack Query, dnd kit
- **API:** Nest.js, JWT auth, Prisma
- **Database:** PostgreSQL (Docker)

## Run it

You need Node 22+ and a local Postgres (Homebrew Postgres is already enough on this machine). Docker Compose is included if you prefer a container later.

```bash
cd TaskLine
createdb taskline   # skip if the database already exists
npm install
cd api && npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
cd ../web && npm install
cd ..
npm run dev
```

- App: http://localhost:3000
- API: http://localhost:4000/api/health

Demo login: `demo@taskline.app` / `demo1234`

Local Postgres uses `localhost:5432` and database `taskline`. `docker-compose.yml` is there if you want a containerized database instead (port 5433).

## What you can do

- Public homepage, login, register
- Dashboard with boards and upcoming dates
- Kanban boards with drag and drop (cards and lists)
- Calendar of due dates
- Timeline of start → due ranges
- Create / edit tasks with priority and dates

## Layout

```
web/   Next.js app
api/   Nest.js API + Prisma
docker-compose.yml
```
