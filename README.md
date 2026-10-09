# CV Builder

```bash
npm install
npm run dev      # http://localhost:3000
```
Deploy: push to GitHub, import the repo in Vercel (framework: Next.js, no config needed).

- 126 templates: 4 categories x 5 layouts x 6 colours, plus 6 Bank CV templates (`src/lib/templates.ts`)
- Editor state auto-saves to localStorage (`src/lib/store.ts`)
- "Download PDF" uses the browser print dialog, so Bengali/Chinese render correctly
- Next: AI route (Groq + Gemini), bilingual mode, file import, share links

## AI
Copy `.env.example` to `.env.local` and add your keys. On Vercel: Project, Settings, Environment Variables.
Keys stay on the server (`src/app/api/ai/route.ts`). If one provider fails, the other is tried.
