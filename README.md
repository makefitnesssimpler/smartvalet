# Smart Valet MVP Scaffold

Simple MVP scaffold with:

- React frontend (single dashboard page, no routing)
- Node.js + Express backend
- In-memory ticket storage
- Ticket lifecycle: `parked -> requested -> ready`

## Run backend

```bash
cd backend
npm install
npm run dev
```

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend expects backend at `http://localhost:4000`.
