# Wiring search-service into your real project

Verified against your actual `api-gateway.zip` and `auth-service.zip` —
these steps use your real filenames, not guesses.

## 1. Drop search-service into place
Extract this zip as `apps/search-service`, alongside your existing
`apps/api-gateway` and `apps/auth-service`.

## 2. Configure `.env`
Copy `.env.example` to `.env` in the **project root** (`search-service/`,
not `search-service/src/`). Fill in the three REQUIRED values — the
service now refuses to boot if any are missing, same fail-fast pattern
your real `auth-service/src/config/env.js` already uses:

- `DATABASE_URL` — same Postgres instance auth-service/user-service use
- `JWT_ACCESS_SECRET` — copy the exact value from your real
  `auth-service/.env`
- `INTERNAL_SERVICE_TOKEN` — copy the exact value from your real
  `auth-service/.env` / `api-gateway/.env`

## 3. Install and migrate
```
cd apps/search-service
npm install
npm run migrate
```
This runs `src/db/migrate.js` against `src/db/schema.sql` — same
pattern as your real `auth-service/src/db/migrate.js`. It's idempotent
(`IF NOT EXISTS` everywhere), safe to re-run.

## 4. Start it
```
npm run dev
```
Watch for: `search-service listening on port 3003 [development]`

## 5. Wire it into your REAL api-gateway

Your actual `api-gateway/src/config/env.js` currently has:
```javascript
services:{
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    user: process.env.USER_SERVICE_URL || "http://localhost:3002"
},
```
Add `search`:
```javascript
services:{
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    user: process.env.USER_SERVICE_URL || "http://localhost:3002",
    search: process.env.SEARCH_SERVICE_URL || "http://localhost:3003"
},
```

Add to `api-gateway/.env`:
```
SEARCH_SERVICE_URL=http://localhost:3003
```

Copy two new files into your real gateway (see the separate
`api-gateway-search-addition.zip`):
- `src/proxies/search.proxy.js`
- `src/routes/search.routes.js`

In your real `api-gateway/src/app.js`, add:
```javascript
const searchRoutes = require("./routes/search.routes");
```
```javascript
app.use("/v1/auth", rateLimiter, authRoutes);
app.use("/v1/users", rateLimiter, userRoutes);
app.use("/v1/search", rateLimiter, searchRoutes);   // ADD THIS LINE
```

Restart api-gateway.

## Two existing issues worth fixing while you're in there

**1. `app.set("trust proxy", true)` in your real `api-gateway/src/app.js`**
still uses `true` instead of `1` — this is the same
`ERR_ERL_PERMISSIVE_TRUST_PROXY` warning you've been seeing on every
gateway startup. Change to:
```javascript
app.set("trust proxy", 1);
```

**2. Your `auth-service/Dockerfile` actually contains a full
docker-compose.yml** (postgres + auth-service + api-gateway service
definitions) — it looks like it landed in the wrong place with the
wrong name. `docker-compose.yml` should sit at your project **root**
(`travel-platform/docker-compose.yml`), not inside `auth-service/`.
Your `api-gateway/DockerFile` is a real, correctly-formed per-service
Dockerfile — search-service's new `Dockerfile` in this zip follows that
same correct pattern. Once you move the compose file to the root, use
`docker-compose.search-service-block.yml` (included here) to add
search-service's service definition to it.

## Verify it's working

```
GET http://localhost:8080/v1/search/airports?q=del
POST http://localhost:8080/v1/search/flights
{
  "origin": "DEL",
  "destination": "BOM",
  "departureDate": "2026-09-15",
  "cabinClass": "ECONOMY"
}
```
Should return airport matches and a list of mock flights, cheapest
first, no login required.
