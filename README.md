# Journey Builder Prefill Challenge

A mock backend plus a React (Vite + TS) frontend that fetches the action blueprint graph, renders forms, and lets you view/edit prefill mappings.

## Structure
- `mock-backend/`: tiny Node http server serving the graph fixture (`/action-blueprint-graph`).
- `frontend/`: Vite React + TypeScript app with prefill UI.

## Run locally
1) Mock backend  
```bash
cd mock-backend
npm install
npm start
```
Serves: `http://localhost:4000/action-blueprint-graph`

2) Frontend  
```bash
cd frontend
npm install
npm run dev -- --port 5177
```
Open `http://localhost:5177` (or the port Vite prints).  
Optional: create `frontend/.env` with `VITE_API_BASE_URL=http://localhost:4000` to point to a different backend.

## What’s implemented
- Fetch graph JSON (supports both raw `nodes/forms/edges` schema and legacy `forms/edges`).
- Normalize graph to `{forms, edges}`; list forms and fields.
- Select a form; per-field mapping pills show prefilled vs none.
- Add/Edit/Clear mapping per field via modal.
- Modal groups sources into Direct deps, Transitive deps, and Global data (static placeholders).
- Selecting a source writes to in-memory prefill state; Clear removes it.

## Extending / swapping data
- Replace `mock-backend/data/graph.json` with the company’s mock payload, or point `VITE_API_BASE_URL` to their mock server.
- Extend source grouping in `buildSourceGroups` (see `frontend/src/App.tsx`) to add new data sources.

## Notes
- Mapping state is in-memory only (no persistence).
- Styling is minimal; focus is on prefill workflow, not DAG rendering.

##Screen
<img width="1110" height="796" alt="image" src="https://github.com/user-attachments/assets/009e729f-24e8-4162-a6ab-35a71dab704a" />


<img width="1103" height="793" alt="image" src="https://github.com/user-attachments/assets/e98748ac-1c56-4c87-95e9-34d1925f7917" />


<img width="1174" height="833" alt="image" src="https://github.com/user-attachments/assets/e061f609-31e2-444c-b235-d8dd6c22feb6" />

