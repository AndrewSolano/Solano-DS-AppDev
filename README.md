# Blog Platform

A mini blog platform built with Node.js and Express, made of two servers and a frontend:

- **Auth Server** (port 4000): registers users, logs them in, and issues JWT access and refresh tokens.
- **Blog API** (port 5000): serves blog posts and verifies the tokens with the same `JWT_SECRET`. It never calls the Auth Server.
- **Frontend** (`frontend/`): a single-page website (HTML, CSS, JavaScript) that uses all 10 endpoints.

There are three roles: `reader`, `author` and `admin`. Anyone can read posts without logging in. Writing needs a valid token.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer
- [Postman](https://www.postman.com/downloads/) (for testing the API)
- The **Live Server** extension in VS Code (for the frontend)

## Setup

Run these steps once, from the project root (`blog-platform/`).

**1. Create the `.env` file**

The `.env` file is not in the repository because it holds the secret. Copy the example:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```
```bash
# Mac / Linux / Git Bash
cp .env.example .env
```

Open `.env` and replace the placeholder with any long random string:

```
JWT_SECRET=put-a-long-random-string-here
```

Both servers read this one file from the project root.

**2. Install packages in both servers**

```powershell
cd auth-server
npm install
cd ../blog-api
npm install
cd ..
```

## Run the project

Open **two terminals** and keep both running.

Terminal 1, Auth Server:
```powershell
cd auth-server
npm start
```
Expected: `Auth Server running on port 4000`

Terminal 2, Blog API:
```powershell
cd blog-api
npm start
```
Expected: `Blog API running on port 5000`

Each terminal should also print `injected env (1) from ..\.env`, which confirms the secret was loaded.

## Run the frontend

1. Start both servers first.
2. In VS Code, right-click `frontend/index.html` and choose **Open with Live Server** (or click **Go Live** in the status bar).
3. The site opens in the browser, usually at `http://127.0.0.1:5500/frontend/index.html`.

## Data storage

Users and posts are kept in in-memory arrays. On startup they are loaded from localStorage, and after every change they are saved back. The data is stored in a `storage/` folder inside each server (`auth-server/storage`, `blog-api/storage`). The folders are created automatically on the first run. Delete them to reset all data.

## API endpoints

### Auth Server (http://localhost:4000)

| Method | Endpoint | Body | Success | Errors |
|---|---|---|---|---|
| POST | `/register` | `username`, `password`, `role` | 201 | 400 missing field or invalid role, 409 username taken |
| POST | `/login` | `username`, `password` | 200 `{ accessToken, refreshToken }` | 400 missing field, 401 wrong credentials |
| POST | `/refresh` | `refreshToken` | 200 `{ accessToken }` | 400 missing token, 401 invalid, expired or revoked |
| POST | `/logout` | `refreshToken` | 200 | 400 missing token |

### Blog API (http://localhost:5000)

Protected routes need the header `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Who can access | Success | Errors |
|---|---|---|---|---|
| GET | `/api/posts` | public | 200 | none |
| GET | `/api/posts/:id` | public | 200 | 404 |
| POST | `/api/posts` | author, admin | 201 | 400, 401, 403 |
| PUT | `/api/posts/:id` | post owner or admin | 200 | 400, 401, 403, 404 |
| DELETE | `/api/posts/:id` | admin | 200 | 401, 403, 404 |
| GET | `/api/me/posts` | any logged-in user | 200 | 401 |

All errors use the format `{ "error": "message" }`.

## Token details

- **Access token**: payload `{ id, username, role }`, valid for 15 minutes.
- **Refresh token**: payload includes `type: "refresh"`, valid for 7 days, and is stored in the user's `refresh_token` field.
- Both are signed with `JWT_SECRET` from the root `.env`.
- The Blog API rejects any token with `type: "refresh"`.
- On login, `refresh_token` is saved and `revoked_at` is cleared. On logout, `refresh_token` is cleared and `revoked_at` is set.

## Quick test (Postman)

1. `POST :4000/register` with `{"username":"admin1","password":"1234","role":"admin"}`. Repeat for an `author` and a `reader`.
2. `POST :4000/login` and copy the `accessToken`.
3. `GET :5000/api/posts` returns `200` with no token.
4. `POST :5000/api/posts` with the author's token (Authorization, Bearer Token) and `{"title":"Hi","content":"Hello"}` returns `201`.
5. The same request with the reader's token returns `403`, with no token returns `401`, and with the refresh token returns `401`.
6. `DELETE :5000/api/posts/1` as the author returns `403`, and as the admin returns `200`.
7. `POST :4000/logout` and then `POST :4000/refresh` with the same token returns `401`.

## Project structure

```
blog-platform/
├── .env.example
├── auth-server/
│   ├── server.js
│   └── src/
│       ├── routes/
│       ├── controllers/
│       └── data/
├── blog-api/
│   ├── server.js
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── middleware/   (authenticate.js, authorize.js)
│       └── data/
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Server starts and exits immediately | The `server.js` file is empty or not saved. |
| `Cannot find module ...` | Run `npm install` inside that server's folder. |
| `secretOrPrivateKey must have a value` | The root `.env` is missing or has no `JWT_SECRET`. |
| `EADDRINUSE` (port already in use) | Another copy of the server is running. Close it, or stop the old terminal with Ctrl+C. |
| Frontend says "Cannot reach the server" | Start both servers, and restart them after any code change. |
| `401 Invalid or expired token` | The access token lasts 15 minutes. Log in again. |