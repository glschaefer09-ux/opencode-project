# GitHub Token Setup

One token, used by every surface: local terminal, OpenCode, Slack bot, Claude.ai chat, and Claude Code cloud sessions.

## 1. Create the token

1. Open https://github.com/settings/tokens?type=beta → **Generate new token**
2. Repository access: **Only select repositories** → `glschaefer09-ux/opencode-project`
3. Permissions: **Contents** read/write, **Pull requests** read/write, **Issues** read/write, **Metadata** read
4. Generate and copy it (`github_pat_...`). It is shown once.

Never paste the token into a chat, issue, or commit.

## 2. Local repo (OpenCode, scripts, Slack bot)

```bash
cp .env.example .env
```

Fill in `.env`:

```
GITHUB_TOKEN=github_pat_...
GH_TOKEN=github_pat_...
```

`.env` is gitignored. `run-budget.ps1` and `run-slack-bot.ps1` load it automatically.

To have it in every terminal instead:

| OS | Command |
|----|---------|
| Windows | `setx GITHUB_TOKEN "github_pat_..."` then open a new terminal |
| macOS/Linux | `echo 'export GITHUB_TOKEN="github_pat_..."' >> ~/.bashrc` (or `~/.zshrc`) |

Verify: `gh auth status` or `curl -s -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user`

## 3. Slack bot

`run-slack-bot.ps1` reads `GITHUB_TOKEN` from `.env`, copies it to `GH_TOKEN` for the `gh` CLI, and warns if it is missing. The bot code is expected in `slack-code-workflow/node` (not yet committed).

## 4. Claude.ai chat

No token needed. Connect GitHub once:

1. claude.ai → **Settings → Connectors** → **GitHub** → Connect
2. Authorize the `glschaefer09-ux` account and grant access to `opencode-project`
3. In any chat, use the **+** / tools menu to attach the repo or enable the GitHub connector

## 5. Claude Code cloud sessions (claude.ai/code)

GitHub already works via the GitHub app (clone, push, PRs). For scripts or the `gh` CLI inside the container:

1. Session title bar → environment menu → **Edit**
2. Add environment variables `GITHUB_TOKEN` and `GH_TOKEN`
3. Start a new session to pick them up

## 6. GitHub Actions

Workflows use the built-in `${{ github.token }}`; no personal token needed. Only add a repo secret (Settings → Secrets and variables → Actions) if a workflow must push to other repos.
