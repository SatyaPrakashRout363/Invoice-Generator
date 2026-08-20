# Invoice Generator

[![CI](https://github.com/SatyaPrakashRout363/Invoice-Generator/actions/workflows/ci.yml/badge.svg)](https://github.com/SatyaPrakashRout363/Invoice-Generator/actions/workflows/ci.yml)

## Run the API
```
cd api
npm install
cp .env.example .env   # then edit .env, see "Environment variables" below
npm start        # http://localhost:4000
```

## Run the UI
```
cd ui
npm install
npm run dev       # http://localhost:5173
```

The UI dev server proxies `/api/*` to the API on port 4000, so open http://localhost:5173 in your browser.

## Environment variables

Copy `api/.env.example` to `api/.env` and set:

| Variable | Description |
| --- | --- |
| `SENDGRID_API_KEY` | API key for [SendGrid](https://sendgrid.com/), used to email invoices and password-reset links. Not required when `SEND_DRY_RUN=true`. |
| `SENDER_EMAIL` | From-address used for all outgoing emails. |
| `SENDER_NAME` | From-name used for all outgoing emails. |
| `SESSION_SECRET` | Secret used to sign session cookies. Set this to a random string in any real deployment. |
| `SEND_DRY_RUN` | When `true`, invoice-send and password-reset emails are simulated (logged, not actually sent) instead of calling SendGrid — useful for local development without a SendGrid account. |
| `SESSION_MAX_AGE_DAYS` | How many days a login session stays valid before requiring re-login. |

### Sessions

Sessions are stored as files on disk under `api/sessions/` (via `session-file-store`), not in a database — no extra infrastructure to run locally. This directory is created automatically and is gitignored.

### Creating a user account

There is no self-service sign-up. To provision an account, run the CLI script from the `api` directory and follow the prompts for username/password:

```
cd api
node scripts/create-user.js
```

This hashes the password and appends the account to `api/data/users.json`.

## MCP servers

`.mcp.json` at the repo root configures three MCP servers for Claude Code:

- **git** — local git operations for this repo, via `uvx mcp-server-git`. No setup needed beyond having `uv`/`uvx` installed.
- **jira** — [mcp-atlassian](https://github.com/sooperset/mcp-atlassian), pointed at the self-hosted Jira instance at `https://jiraeu.epam.com` (username + password auth, not Atlassian Cloud OAuth). Requires these environment variables set before starting Claude Code:
  - `JIRA_USERNAME` — your Jira username
  - `JIRA_PASSWORD` — your Jira password
- **github** — the official GitHub MCP server, run via Docker. Requires Docker, and these environment variables set before starting Claude Code:
  - `GITHUB_TOKEN` — a GitHub personal access token
  - `GITHUB_USERNAME` — your GitHub username

None of these credentials are stored in `.mcp.json` — it only references the env var names, so it's safe to commit.

`.github/copilot-instructions.md` documents the same Jira/GitHub/git setup for GitHub Copilot's coding agent. It's guidance text only — it does not itself wire up a live MCP connection. GitHub Copilot's coding agent runs in the cloud and cannot see local environment variables, so its credentials must instead be configured as repo secrets under `Settings → Copilot → Coding agent` on GitHub, not as local env vars and not hardcoded anywhere in this repo.
