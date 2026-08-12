# Invoice Generator

[![CI](https://github.com/SatyaPrakashRout363/Invoice-Generator/actions/workflows/ci.yml/badge.svg)](https://github.com/SatyaPrakashRout363/Invoice-Generator/actions/workflows/ci.yml)

## Run the API
```
cd api
npm install
npm start        # http://localhost:4000
```

## Run the UI
```
cd ui
npm install
npm run dev       # http://localhost:5173
```

The UI dev server proxies `/api/*` to the API on port 4000, so open http://localhost:5173 in your browser.

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

`.github/copilot-instructions.md` documents the same Jira/GitHub/git setup for GitHub Copilot Chat in VS Code. Note that this file is guidance text only — it does not itself wire up a live MCP connection for Copilot Chat. If you also want Copilot Chat to actually connect (not just know about the setup), that needs a `.vscode/mcp.json` file, which is not included yet.
