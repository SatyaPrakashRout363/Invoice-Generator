# Copilot instructions — Invoice Generator

## What this app is
A single-repo invoice generator: `api/` is an Express backend (JSON-file storage under `api/data/`), `ui/` is a Vite/React frontend. The UI dev server proxies `/api/*` to the API on port 4000.

## MCP servers
`.mcp.json` at the repo root configures MCP servers for Claude Code:
- **git** — local git operations via `uvx mcp-server-git`.
- **jira** — [mcp-atlassian](https://github.com/sooperset/mcp-atlassian), pointed at the self-hosted Jira instance at `https://jiraeu.epam.com`. Credentials come from the `JIRA_USERNAME` / `JIRA_PASSWORD` environment variables — never hardcoded in `.mcp.json`.

GitHub Copilot's coding agent runs in the cloud and cannot see local environment variables. Its Jira/GitHub credentials must be configured as repo secrets under `Settings → Copilot → Coding agent`, never as literals in this repo.

## CI
`.github/workflows/ci.yml` is the only file GitHub Actions auto-discovers; keep it there.

## Non-negotiable
Never hardcode secrets/tokens/passwords anywhere in this repo, including example configs. Use environment variable placeholders (`${VAR_NAME}`) and document the variable in `README.md`.
