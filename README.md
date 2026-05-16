# frontend-aluno

SPA do **aluno** do FichaGym — irmão do `frontend-coach` (SPA do personal),
consumindo o mesmo backend Django.

Cobre:
- Login (email ou username) e troca de senha
- Lista de fichas + detalhe
- Execução completa de treino (timer + marcar séries → set_logs)
- Próprio desempenho (KPIs + charts) e histórico paginado
- Aba "Personal" com dados do trainer + link WhatsApp
- Página "Minha conta" pra editar email/telefone

Stack idêntico ao `frontend-coach`: Vite + React 18 + TS + Tailwind + Radix +
TanStack Query + Recharts.

## Dev

```bash
npm install
npm run dev   # http://localhost:5174 (porta dedicada — coach usa 5173)
```

Aponta pra `VITE_API_BASE_URL` em `.env.development` (default
`http://localhost:8000`, Docker do backend).

## Build / deploy

`npm run build` → `dist/` estático. Em produção é servido pelo nginx
da mesma VPS do backend, no subdomínio `aluno.fichagym.com`. Veja
`backend-gymapp/deploy/scripts/deploy-aluno.sh`.
