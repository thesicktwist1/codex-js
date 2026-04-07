# codex-js

Minimal Node.js starter using Express and MongoDB.

## Features

- Lightweight API scaffold using Express and the official MongoDB driver
- Authentication helpers (`jsonwebtoken`, `bcrypt`) and input validation (`Joi`)
- Rate limiting and sanitization middleware
- Tests with Vitest and an in-memory MongoDB for CI-friendly tests

## Prerequisites

- Node.js >= 18.12.0
- npm (or your preferred Node package manager)

## Quick start

1. Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd codex-js
npm install
```

2. Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

3. Run the app in development:

```bash
npm run dev
```

4. Run in production:

```bash
npm start
```

## Environment

Required environment variables (see `.env.example`):

- `ATLAS_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing access tokens
- `REFRESH_SECRET` — secret for signing refresh tokens

Optional environment variables:

- `JWT_EXPIRES_IN` — access token duration (default: `30m`)
- `REFRESH_EXPIRATION_DAYS` — refresh token lifetime in days (default: `7`)
- `PORT` — server port (default: `5050`)
- `NODE_ENV` — `development` or `production`

## API Overview

Base path: `/api`

- **Auth** (`/api/auth`)
  - `POST /auth/login` — body: `{email, password}`; returns `{user, accessToken}` and sets an `httpOnly` `refreshToken` cookie.
  - `POST /auth/register` — body: `{email, username, password}`; creates a user and returns `{user}`.
  - `POST /auth/refresh` — reads `refreshToken` cookie and returns `{accessToken}`.
  - `POST /auth/revoke` — authenticated; revokes refresh token and clears cookie (204).

- **Books** (`/api/books`)
  - `GET /books` — query params: `limit`, `page`; returns an array of books.
  - `GET /books/:bookId` — returns a single book by id.
  - `POST /books` — authenticated; body: `{title, pageCount, description, author, chapters}`; creates a book.
  - `POST /books/:bookId/reviews` — authenticated; create a review for a book.
  - `GET /books/:bookId/reviews` — list reviews for a book (query: `limit`, `page`).

- **Reviews** (`/api/reviews`)
  - `GET /reviews` — list reviews (query: `limit`, `page`).
  - `GET /reviews/:id` — get a single review.
  - `PUT /reviews/:id` — authenticated; update a review (`{rating, description}`).
  - `DELETE /reviews/:id` — authenticated; delete a review (204).

- **User** (`/api/user`)
  - `GET /user` — authenticated; get the authenticated user's profile.
  - `PUT /user` — authenticated; update password: `{currentPassword, newPassword}`.
  - `DELETE /user` — authenticated; delete account (requires `{password}` in body).
  - `GET /user/:userId/reviews` — list reviews created by the given user.

Validation rules for request bodies are defined in [utils/joiSchemas.js](utils/joiSchemas.js).

## Examples

Login and persist cookies with `curl` (save cookie jar):

```bash
curl -X POST http://localhost:5050/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"user@example.com","password":"Password123"}' \
	-c cookies.txt
```

Use the returned `accessToken` for authenticated requests:

```bash
ACCESS_TOKEN=<token-from-login>
curl -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:5050/api/user
```

Refresh an access token using the stored cookie jar:

```bash
curl -X POST http://localhost:5050/api/auth/refresh -b cookies.txt
```

Create a book (authenticated):

```bash
curl -X POST http://localhost:5050/api/books \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-d '{"title":"My Book","pageCount":123,"description":"Desc","author":"Auth","chapters":["Intro"]}'
```

## Project layout

- `server.js` — application entrypoint ([server.js](server.js))
- `db/conn.js` — database connection and index setup ([db/conn.js](db/conn.js))
- `utils/joiSchemas.js` — validation schemas ([utils/joiSchemas.js](utils/joiSchemas.js))

## License

MIT
