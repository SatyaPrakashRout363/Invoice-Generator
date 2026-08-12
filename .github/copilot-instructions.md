# Copilot instructions for Invoice-Generator

This repo exposes MCP servers (see `.mcp.json`) for git, GitHub, and Jira. When working on
this project:

## Jira

- Jira instance: `https://jiraeu.epam.com` (self-hosted Server/Data Center, not Atlassian Cloud).
- Auth: username + password, read from `JIRA_USERNAME` / `JIRA_PASSWORD` environment variables.
  Never hardcode credentials in code, config, or commit messages.
- When asked to look up, create, or update a Jira issue, use the `jira` MCP server rather than
  guessing issue keys or statuses.

## GitHub

- Auth via `GITHUB_TOKEN` / `GITHUB_USERNAME` environment variables, used by the `github` MCP
  server (see `.mcp.json`) for PRs, issues, and repo operations.

## Git

- Use the local `git` MCP server for repository operations (status, diff, log, commit) instead
  of shelling out where possible.
