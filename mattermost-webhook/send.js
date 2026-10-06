// Send a message to a Mattermost channel via an incoming webhook.
//
// Usage:
//   node send.js "Hello from the webhook"
//   import { sendToMattermost } from "./send.js"
//
// Requires MATTERMOST_WEBHOOK_URL in the environment (see .env.example).

export async function sendToMattermost(text, options = {}) {
  const url = options.webhookUrl || process.env.MATTERMOST_WEBHOOK_URL;
  if (!url) {
    throw new Error("MATTERMOST_WEBHOOK_URL is not set");
  }

  const payload = {
    text,
    ...(options.channel ? { channel: options.channel } : {}),
    ...(options.username ? { username: options.username } : {}),
    ...(options.iconUrl ? { icon_url: options.iconUrl } : {}),
    ...(options.attachments ? { attachments: options.attachments } : {}),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mattermost responded ${res.status}: ${body}`);
  }
  return true;
}

// Run directly from the CLI.
if (import.meta.url === `file://${process.argv[1]}`) {
  const text = process.argv.slice(2).join(" ") || "Test message from mattermost-webhook";
  sendToMattermost(text)
    .then(() => {
      console.log("Message sent.");
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
