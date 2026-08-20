---
applyTo: "**"
---

# Security rules

- Never hardcode secrets, tokens, passwords, or API keys in any file, including config files, example files, and documentation. Use environment-variable placeholders (`${VAR_NAME}`) instead, and document the variable name in `README.md`.
- If you find a hardcoded credential in any file you read or touch, stop and flag it immediately rather than working around it or leaving it in place.
- `.mcp.json` must only ever reference environment variable names for MCP server credentials (e.g. `JIRA_USERNAME`, `JIRA_PASSWORD`) — never literal values.
- GitHub Copilot's coding agent cannot see local environment variables; its credentials belong in repo secrets under `Settings → Copilot → Coding agent`, never in tracked files.
