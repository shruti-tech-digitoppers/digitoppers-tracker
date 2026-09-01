# Digitopper Project Tracker Frontend

Next.js App Router + TypeScript + Tailwind CSS + lucide-react frontend scaffold based on the uploaded architecture/specification.

Source: uploaded project prompt (1410 lines).

## Run
1. `npm install`
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL`.
3. `npm run dev`

The frontend uses the documented `/projects` API contract and `digitopper_token` localStorage token. The tracker page includes a UI workspace; wire its stage/task callbacks to the backend's actual tracker contracts before production use.
