// Receiver for Mattermost outgoing webhooks and slash commands.
//
// Mattermost sends an application/x-www-form-urlencoded POST with fields like:
//   token, team_id, channel_id, channel_name, user_id, user_name, text, trigger_word, command
//
// Configure the integration in Mattermost to point at:  http(s)://<host>:<PORT>/mattermost
// Set MATTERMOST_TOKEN to the token Mattermost generates, so requests can be verified.

import express from "express";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

function allowedTokens() {
  return (process.env.MATTERMOST_TOKEN || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function verifyToken(req, res, next) {
  const tokens = allowedTokens();
  if (tokens.length === 0) {
    return res.status(500).json({ text: "Server misconfigured: MATTERMOST_TOKEN not set" });
  }
  const token = req.body?.token;
  if (!token || !tokens.includes(token)) {
    return res.status(401).json({ text: "Unauthorized" });
  }
  next();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/mattermost", verifyToken, (req, res) => {
  const { user_name: userName, text, trigger_word: triggerWord, command } = req.body;

  // Build a response. Mattermost posts the `text` field back into the channel.
  const prompt = triggerWord ? text.replace(triggerWord, "").trim() : text;
  const responseText = command
    ? `Received command \`${command}\` from @${userName}: ${prompt}`
    : `Hi @${userName}, you said: ${prompt}`;

  res.json({
    response_type: "in_channel",
    text: responseText,
  });
});

app.listen(PORT, () => {
  console.log(`Mattermost webhook receiver listening on port ${PORT}`);
});

export default app;
