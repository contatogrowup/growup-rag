growup-rag/
├─ package.json
├─ tsconfig.json
├─ next.config.js
├─ postcss.config.js
├─ tailwind.config.js
├─ .gitignore
├─ .env.example
├─ src/
│  ├─ app/
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ login/page.tsx
│  │  ├─ wizard/page.tsx
│  │  ├─ confirmacao/page.tsx
│  │  ├─ pre-plano/[id]/page.tsx
│  │  ├─ admin/config/page.tsx
│  │  ├─ admin/playbook/page.tsx
│  │  └─ api/assessments/[id]/compute/route.ts
│  └─ lib/
│     ├─ compute.ts
│     └─ supabaseServer.ts
└─ supabase/
   ├─ schema.sql
   └─ seed_min.sql
