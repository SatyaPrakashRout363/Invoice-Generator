# Copilot instructions — Invoice Generator

## What this app is
A single-repo invoice generator: `api/` is an Express backend (JSON-file storage under `api/data/`), `ui/` is a Vite/React frontend. The UI dev server proxies `/api/*` to the API on port 4000.

## MCP servers
`.mcp.json` at the repo root configures MCP servers for Claude Code:
- **git** — local git operations via `uvx mcp-server-git`.
- **jira** — [mcp-atlassian](https://github.com/sooperset/mcp-atlassian), pointed at the self-hosted Jira instance at `https://jiraeu.epam.com`. Credentials come from the `JIRA_USERNAME` / `JIRA_PASSWORD` environment variables — never hardcoded in `.mcp.json`.

GitHub Copilot's coding agent runs in the cloud and cannot see local environment variables. Its Jira/GitHub credentials must be configured as repo secrets under `Settings → Copilot → Coding agent`, never as literals in this repo. See `.github/instructions/security.instructions.md` for the hard rule this implies.

## Agentic SDLC docs convention
Every Jira story worked through the 8-step Agentic SDLC pipeline (Requirements → Architecture → Design Review → Implementation Planning → Implementation → Review → Verify → PR) gets a folder at `docs/sdlc/<STORY-KEY>-<slug>/` with numbered docs `01-requirements.md` through `07-pr-description.md`. See `docs/sdlc/README.md` for the full convention and the list of stories already tracked this way. `.github/workflows/` is reserved for CI YAML only — SDLC docs never go there.

## Driving the pipeline
- `.github/prompts/01-requirements.prompt.md` through `07-pr.prompt.md` — one reusable prompt per SDLC step; each reads/writes under `docs/sdlc/${input:story}/`.
- `.github/chatmodes/orchestrator.chatmode.md` — a chat mode that walks all 8 steps for a given story end-to-end, delegating to the matching prompt file and pausing for explicit human sign-off between each step.

## Non-negotiable
Never hardcode secrets/tokens/passwords anywhere in this repo, including example configs. Use environment variable placeholders (`${VAR_NAME}`) and document the variable in `README.md`.
