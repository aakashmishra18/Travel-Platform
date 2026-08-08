# supplier-service — setup and integration

## What this is

The integration layer between your platform and real flight data
providers, exactly per your design doc. Right now it has three
providers registered:

- **MOCK** — always active, no credentials needed. Fully functional:
  search, revalidate, availability, fare rules, book, cancel all work
  end-to-end against it.
- **DUFFEL** — real integration code, dormant until `DUFFEL_API_KEY`
  is set.
- **AMADEUS** — real integration code (including OAuth2 token
  handling) for search; revalidate/availability/book/cancel throw a
  clear "not yet wired" error even if you add Amadeus keys, because
  those need the raw provider offer payload retained (see the comment
  in `amadeus.provider.js`) — worth revisiting once you're actually
  activating Amadeus.

**The rest of your platform never knows which provider answered** —
every provider's output gets normalized into one shape before it ever
leaves this service.

## Setup

```
cd apps/supplier-service
npm install
```

Copy `.env.example` to `.env`, fill in:
- `DATABASE_URL` — same Postgres instance as your other services
- `INTERNAL_SERVICE_TOKEN` — copy the exact value from your other
  services' `.env` files

Leave every `DUFFEL_*`/`AMADEUS_*` line commented out for now — MOCK
alone is enough to run and test everything.

```
npm run migrate
npm run dev
```

Watch for:
```
info: Active providers: MOCK {"providers":["MOCK"]}
info: supplier-service listening on port 3004 [development]
```

## This service is NOT wired into api-gateway — and shouldn't be

Unlike auth/user/search-service, supplier-service has no end-user
facing routes at all. It's called by other backend services only
(search-service today, booking-service later), always
server-to-server with the internal token. There's no `/v1/...` public
path for it — test it directly against `localhost:3004`, per the
included Postman collection.

## Testing the full flow

1. **Search Flights** — run this first in the Postman collection; its
   test script auto-saves a real `offerId` into the collection variable
2. **Get Offer Details** — full normalized offer, whichever provider
   answered
3. **Revalidate Offer** — MOCK simulates realistic price drift (~30%
   chance the price moved since search, seeded by a 5-minute time
   bucket so repeated calls within that window stay consistent)
4. **Check Availability** — similar simulated logic
5. **Get Fare Rules** — pulled from the offer's stored payload, no
   extra provider call needed
6. **Book Flight** — creates a real row in `supplier_bookings`, marks
   the offer `BOOKED`, returns a PNR/ticket number (fake but
   consistently generated for MOCK)
7. **Cancel Booking** — reverses it, calculates a refund based on the
   fare's `refundable` flag
8. **Provider Health** — shows recent call stats per provider (empty
   until you've made calls; each interaction above feeds into this)

## Two important things NOT done yet — on purpose

**1. search-service still generates its own mock data locally.**
Per your pipeline diagram, search-service should call THIS service
instead of `src/services/supplier/flightSupplierClient.js` doing its
own local generation. That's the natural next step — search-service's
supplier client becomes a thin HTTP client calling
`POST http://supplier-service:3004/internal/flights/search`. Want that
wired next?

**2. No real booking should happen yet.** `POST /flights/book` works
today against MOCK, but nothing gates it on real payment — that's
Booking Service's and Payment Service's job, neither of which exist
yet. Treat this endpoint as the tested building block those will call,
not something to expose to end users directly.

## Activating a real provider, when you're ready

Duffel: uncomment `DUFFEL_API_KEY` in `.env`, restart. That's it — no
code changes. First real search response should be compared against
`duffel.provider.js`'s `normalizeOffer()` field mappings, since this
was written from documentation without a live key to verify against.

Amadeus: same for `AMADEUS_API_KEY`/`AMADEUS_API_SECRET` — search will
work, but read the comment on `revalidateOffer` in
`amadeus.provider.js` before relying on revalidate/availability/book
for Amadeus specifically.
