# Shivasha Seva API

Node.js API for receiving help requests and volunteer-interest submissions from the GitHub Pages website.

## Shared Shivasha database

This API reuses the existing Shivasha MongoDB service and the existing `shivasha` database. It does **not** create a separate database or MongoDB instance.

It writes only to these Seva-specific collections:

- `seva_help_requests` — help requests.
- `seva_volunteers` — volunteer-interest submissions.

Other Shivasha modules keep their own collections. Do not run database-drop or reset commands for this service.

## Endpoints

- `GET /api/health` — service and MongoDB connection status.
- `POST /api/requests` — stores a help request after consent and validation.
- `POST /api/volunteers` — stores a volunteer-interest submission after consent and validation.
- `GET /api/admin/submissions?limit=50` — lists recent submissions from both Seva collections; requires `Authorization: Bearer <ADMIN_API_KEY>`.

Submissions are private and are not published to the website. The admin key must never be placed in browser code.

## Required environment

Copy `.env.example` into the server's secret environment and set:

- `MONGODB_URI`: use the existing internal connection string `mongodb://shivasha-database:27017/shivasha` when this API container joins the existing Shivasha Docker network.
- `ADMIN_API_KEY`: a randomly generated secret of at least 32 characters.
- `FRONTEND_ORIGIN`: exact website origin, normally `https://devops-saurabhpandey.github.io`.
- `PORT`: defaults to `8080`.

Never expose MongoDB port 27017 publicly. The API container must be attached to the same private Docker network as the existing `shivasha-database` service; verify the actual network name on the host before deployment.

## Run alongside the existing Shivasha Docker stack

This repository includes `compose.seva.yml`, a small Compose overlay that builds only the Seva API and attaches it to the existing `shivasha_default` Docker network. It does not define, replace, or start MongoDB.

1. Confirm the existing Shivasha stack is running and its network is named `shivasha_default` (`docker network ls`).
2. In the checked-out `shivasha-seva` repository, create a private server-side `.env` from `.env.example`; set a strong random `ADMIN_API_KEY`. Never commit this file.
3. Run `docker compose -f compose.seva.yml up -d --build`.
4. Check `docker compose -f compose.seva.yml ps` and the API health endpoint from inside the private network. The health check requires MongoDB to report `connected`.

If the actual network name differs, change only the overlay's external network name after verifying it. Do not create another MongoDB container or publish port 27017.

The API is exposed only to containers on the shared network. Publish it publicly only through the existing reverse proxy with HTTPS and a narrowly scoped route; do not expose the API container port directly.

## Current integration status

The API source is prepared, but it is **not deployed** and no live database connection has been verified. The public website continues using its share/clipboard fallback until an HTTPS API URL is configured in the frontend. Set that URL only after the API is reachable and its health endpoint reports the database as connected.

## Security and operations

- JSON request body is limited to 10 KB.
- Helmet security headers, exact-origin CORS and per-IP rate limiting are enabled.
- Inputs are length-limited and stored as private records with a review status.
- The admin endpoint requires a server-side secret.
- Rate limiting is in-memory and suitable only for a single API instance; use a shared store if scaling horizontally.
- Establish a privacy notice, retention/deletion schedule, backup policy and authorized admin process before collecting real public submissions.
- Do not store sensitive medical details, identity numbers, passwords or precise rescue locations.
