# prelegal
A platform for drafting common legal agreements

## Status

🚧 This project is a work in progress. It is expected to be completed within one week (by November 1, 2026).

## Run

Requires Docker. The app is served on http://localhost:8000.

```bash
scripts/start-mac.sh      # or start-linux.sh / start-windows.ps1
scripts/stop-mac.sh       # or stop-linux.sh / stop-windows.ps1
```

Create an account to sign in. Your documents are saved as you draft them, but the SQLite database is recreated on every start, so accounts and documents do not survive a restart.

## Structure

- `frontend/` Next.js app, exported as static files (`npm test`)
- `backend/` Spring Boot app serving the API under `/api` and the frontend (`mvn test`)
- `templates/` Common Paper legal templates, listed in `catalog.json`
