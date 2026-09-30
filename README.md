# Library Management System — Pathani Samanta College

Frontend-only React app (Vite, TypeScript, Tailwind v4, Zustand) containing just the library system:
catalogue, circulation, members, reservations, fines, reports, notices and a student portal.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm test         # unit + smoke tests
```

## Demo accounts (`/login`)

| Role | Username | Password | Can do |
| --- | --- | --- | --- |
| Administrator | `admin` | `admin123` | Everything, incl. deleting members |
| Librarian | `librarian` | `librarian123` | Catalogue, circulation, members, reservations, fines, reports, notices |
| Student (Student tab) | `2026001` | `student123` | Student portal |

A second librarian (`librarian2` / `librarian123`) is also seeded.

## Per-copy barcodes, requests and scanning

Every physical copy of a book has its own barcode (e.g. `PSC-0001-03`), tracked separately from the
title record. This backs three flows:

- **Add a book** (`Books Catalogue → Add Book`) — scan or type the ISBN (checksum-validated); on save,
  one barcode is generated per copy and a printable Code128 label sheet opens automatically
  (`Books Catalogue → a book → Print Labels`).
- **Student requests** (`Student → Catalogue → Request`, only offered when a copy is available) — the
  librarian reviews requests at `Requests`; approving holds one specific copy for pickup. The student
  tracks status at `Student → My Requests`. Unclaimed holds expire automatically
  (`Library Settings → reservation hold days`).
- **Issue a Book** (`Circulation → Issue a Book`) — scan a copy's barcode to issue it directly, or to
  complete pickup for an approved request (scanning a held copy auto-fills the right member). Manual
  member/title search still works and auto-picks an available copy. `Return a Book` also accepts a
  scanned barcode.

A USB/Bluetooth barcode scanner behaves like a keyboard (types the code, then Enter), so no special
integration is needed — the scan fields are just text inputs listening for Enter. There's no camera-based
scanning built in.

## Code map

- `src/pages` – screens (books, circulation, members, reservations, requests, fines, reports, notices, settings, student portal)
- `src/store` – Zustand stores (persisted to `localStorage`): `copiesStore` is the source of truth for
  per-copy status and keeps `Book.availableCopies` in sync; `requestsStore` handles the student-request →
  librarian-approval → hold lifecycle; `loansStore.issueBook` optionally takes a scanned copy barcode
- `src/data` – seeded demo dataset (books, loans, per-copy barcodes, requests, etc.)
- `src/utils/barcode.ts` – copy-barcode generation and ISBN-10/13 checksum validation
- `src/access` – roles (admin / librarian / student) and the fixed permission matrix
- `src/routes` – route table and guards (`RequireAuth`, `RequirePermission`)
- `src/components`, `src/utils` – shared UI, tables, forms, charts, fine/loan calculations

The app is served from the site root (`/login`, `/dashboard`, `/books`, …). To mount it under a prefix,
change `LMS_BASE` in `src/routes/routePaths.ts` and the router `basename`.

## Limitations (demo build)

There is no backend. All data, accounts and passwords live in the browser (`localStorage`); passwords are plain text
and permission checks run only in the browser. A real deployment needs a server that hashes passwords and repeats
every permission check. In particular, a request made on a student's own device will not reach a librarian's
computer — this build demonstrates and tests the full request/approve/scan-issue logic on one machine; a live
cross-device version needs a real backend (e.g. a Django REST API, matching this project's data model). Use
*Library Settings → reset* to reseed the demo data.
