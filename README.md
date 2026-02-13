# IP App Web

React frontend for an IP geolocation app with login, map display, and searchable IP history.

## Features
- Login screen with API-based authentication.
- Persisted session state via `localStorage`.
- Default IP geolocation view on load.
- Public IPv4 search with client-side validation.
- Search history list with:
  - Click-to-lookup behavior.
  - Multi-select delete.
- Leaflet map centered on selected IP location.

## Tech Stack
- React (Create React App)
- Axios
- Leaflet + React Leaflet
- CSS modules via app-level styles (`src/App.css`)

## Project Structure
- `src/App.js`: app entry and login/home routing by auth state.
- `src/pages/Login.js`: login form and `/login` API call.
- `src/pages/Home.js`: IP lookup flows, history actions, map rendering.
- `src/App.css`: shared UI styling.

## Prerequisites
- Node.js 18+
- npm

## Setup
```bash
npm install
```

## Environment Variables
Create a `.env` file in the project root if your backend is not served from the same origin.

```env
REACT_APP_API_BASE=http://localhost:5000/api
```

If omitted, the app defaults to:

```env
REACT_APP_API_BASE=/api
```

## Run Locally
```bash
npm start
```

App runs at `http://localhost:3000` by default.

## Build
```bash
npm run build
```

## Test
```bash
npm test -- --watchAll=false
```

## Expected Backend API Contract
This frontend calls the following endpoints under `REACT_APP_API_BASE`:

- `POST /login`
  - Request: `{ "email": string, "password": string }`
  - Response: `{ "user": object }`

- `GET /home`
  - Response includes:
    - `ipData` with fields used by UI: `ip`, `city`, `region`, `country`, `loc`
    - `ip_history`: array of history rows

- `POST /home/search`
  - Request: `{ "ip": string }`
  - Response: updated `ipData` and `ip_history`

- `POST /home/lookup`
  - Request: `{ "ip": string }`
  - Response: `ipData`

- `DELETE /home/history`
  - Request body: `{ "ids": number[] }`
  - Response: updated `ip_history`

## Notes
- The frontend blocks private IPv4 ranges before hitting search API.
- Leaflet marker assets are configured in `src/pages/Home.js` for CRA bundling compatibility.
