# Smart Valet MVP Scaffold

Simple MVP scaffold with:

- React frontend (single dashboard page, no routing)
- Node.js + Express backend
- In-memory ticket storage
- Ticket lifecycle: `parked -> requested -> ready`

## Quick start (single command)

```bash
cd frontend
npm install
npm run dev
```

What `npm run dev` does in `frontend/`:

- starts Vite for the React UI
- starts backend API from `../backend`
- auto-opens the dashboard in your browser

## Alternative: run backend manually

```bash
cd backend
npm install
npm run dev
```

If you run backend separately, frontend API calls still use `/api` via Vite proxy to `http://localhost:4000`.
