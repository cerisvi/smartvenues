# SmartVenues – Portale WebGIS

Portale WebGIS per la gestione e ricerca di venue italiane (congressi, fiere, impianti sportivi, intrattenimento).

## Stack tecnologico

| Layer | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Mappa | Leaflet + react-leaflet |
| Stile | Tailwind CSS v4 |
| Backend | FastAPI (Python 3.11) |
| Dati | GeoJSON |

## Funzionalità

- **Mappa interattiva** con marker categorizzati per tipo di venue
- **Pannello laterale** con lista venue scorrevole
- **Ricerca full-text** per nome, città, regione
- **Filtri** per categoria, regione e capienza minima
- **Scheda dettaglio** con immagine, servizi, contatti e valutazione
- **Cambio base map**: OpenStreetMap, CartoDB Light/Dark, ESRI Satellite
- **Legenda** e **barra statistiche**
- Sidebar collassabile

## Struttura progetto

```
smartvenues/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/   # MapView, Sidebar, VenueCard, VenueDetail, …
│   │   ├── hooks/        # useVenues, useStats, useRegions
│   │   ├── types/        # TypeScript types
│   │   └── data/         # categoryConfig
│   └── dist/         # Build output
└── backend/           # FastAPI server
    ├── main.py
    └── data/
        └── venues.json   # GeoJSON dataset
```

## Avvio in sviluppo

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Il server parte su `http://localhost:8000`.

### Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
Il frontend parte su `http://localhost:5173` e fa proxy delle chiamate `/api/*` verso il backend.

## API endpoints

| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/venues` | Lista venue (filtri: category, region, min_capacity, search) |
| GET | `/api/venues/{id}` | Dettaglio singola venue |
| GET | `/api/categories` | Categorie disponibili |
| GET | `/api/regions` | Regioni disponibili |
| GET | `/api/stats` | Statistiche generali |
