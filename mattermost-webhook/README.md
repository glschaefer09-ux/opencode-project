# Mattermost Webhook

A small, self-contained integration for Mattermost that can both **send** messages
into a channel (incoming webhook) and **receive** callbacks from Mattermost
(outgoing webhooks and slash commands).

## Contents

- `send.js` — POST a message to a Mattermost incoming webhook URL (CLI + importable function).
- `server.js` — Express server that receives Mattermost outgoing webhooks / slash commands and replies, with token verification.
- `.env.example` — environment variables to copy to `.env`.

## Setup

```bash
cd mattermost-webhook
npm install
cp .env.example .env
# edit .env with your values
```

## Sending to Mattermost (incoming webhook)

1. In Mattermost: **Integrations → Incoming Webhooks → Add** and copy the URL.
2. Put it in `.env` as `MATTERMOST_WEBHOOK_URL`.
3. Send a message:

```bash
npm run send -- "Hello from the webhook"
```

Or from code:

```js
import { sendToMattermost } from "./send.js";
await sendToMattermost("Deploy finished", { username: "ci-bot" });
```

## Receiving from Mattermost (outgoing webhook / slash command)

1. In Mattermost: **Integrations → Outgoing Webhooks** (or **Slash Commands**) and point the
   callback URL at `http(s)://<your-host>:<PORT>/mattermost`.
2. Copy the generated **token** into `.env` as `MATTERMOST_TOKEN`
   (comma-separate multiple tokens).
3. Start the server:

```bash
npm start
```

Endpoints:

- `GET /health` — health check.
- `POST /mattermost` — receives Mattermost callbacks; rejects requests whose `token` is not in `MATTERMOST_TOKEN`.

The server must be reachable from your Mattermost instance (public URL, tunnel, or same network).

## Creating a private GitHub repository for this

This code currently lives inside `opencode-project`. To move it into its own
**private** repository:

```bash
# from the mattermost-webhook/ directory
gh repo create <your-user>/mattermost-webhook --private --source=. --remote=origin --push
```

Or manually:

1. Create an empty private repo on github.com (toggle **Private**).
2. Then:

```bash
cd mattermost-webhook
git init
git add .
git commit -m "Initial Mattermost webhook"
git branch -M main
git remote add origin git@github.com:<your-user>/mattermost-webhook.git
git push -u origin main
```

> The `gh` CLI needs auth: `gh auth login` (or a `GH_TOKEN` with `repo` scope).
> Never commit your `.env`; it is already gitignored.
