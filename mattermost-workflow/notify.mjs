// Post a message to Mattermost via an incoming webhook.
//
// Usage:
//   node notify.mjs "message text"
//   echo "message" | node notify.mjs
//
// Required env var:
//   MATTERMOST_WEBHOOK_URL  incoming webhook URL

import { readFileSync } from "node:fs";

const url = process.env.MATTERMOST_WEBHOOK_URL;
if (!url) {
  console.error("MATTERMOST_WEBHOOK_URL is not set.");
  process.exit(1);
}

let text = process.argv.slice(2).join(" ").trim();
if (!text) {
  try {
    text = readFileSync(0, "utf8").trim();
  } catch {
    text = "";
  }
}
if (!text) {
  console.error("No message provided.");
  process.exit(1);
}

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text }),
});

if (!res.ok) {
  console.error(`Webhook post failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log("Mattermost notification sent");
