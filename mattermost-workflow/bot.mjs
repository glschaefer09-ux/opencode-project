// Mattermost local AI agent.
//
// Connects to a Mattermost server with a bot access token, listens on the
// WebSocket API for posts that mention the bot, runs the local OpenCode agent
// on the message text, and replies in the same channel/thread.
//
// Required env vars (see .env.example):
//   MATTERMOST_URL        e.g. https://mattermost.example.com
//   MATTERMOST_BOT_TOKEN  bot account personal access token
// Optional:
//   MATTERMOST_TEAM       team name (slug) used for status logging only
//   OPENCODE_CMD          command to run the agent (default: "opencode run")

import { spawn } from "node:child_process";
import { WebSocket } from "ws";

const RAW_URL = process.env.MATTERMOST_URL;
const TOKEN = process.env.MATTERMOST_BOT_TOKEN;
const OPENCODE_CMD = process.env.OPENCODE_CMD || "opencode run";

if (!RAW_URL || !TOKEN) {
  console.error(
    "MATTERMOST_URL and MATTERMOST_BOT_TOKEN must be set. See GITHUB-TOKEN-SETUP.md",
  );
  process.exit(1);
}

const baseUrl = RAW_URL.replace(/\/+$/, "");
const apiUrl = `${baseUrl}/api/v4`;
const wsUrl = `${baseUrl.replace(/^http/, "ws")}/api/v4/websocket`;

const authHeaders = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function api(path, options = {}) {
  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mattermost API ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

async function postMessage(channelId, message, rootId) {
  return api("/posts", {
    method: "POST",
    body: JSON.stringify({
      channel_id: channelId,
      message,
      root_id: rootId || "",
    }),
  });
}

// Run the OpenCode agent on the given prompt and return its stdout.
function runAgent(prompt) {
  return new Promise((resolve) => {
    const [cmd, ...baseArgs] = OPENCODE_CMD.split(" ").filter(Boolean);
    const child = spawn(cmd, [...baseArgs, prompt], {
      cwd: process.cwd(),
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => resolve(`Agent failed to start: ${err.message}`));
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim() || "(no output)");
      else resolve(`Agent exited with code ${code}.\n${stderr.trim()}`);
    });
  });
}

// Strip the leading @bot mention from the message text.
function stripMention(text, username) {
  return text.replace(new RegExp(`@${username}\\b`, "gi"), "").trim();
}

async function handlePost(me, post) {
  if (!post || post.user_id === me.id) return;
  if (!post.message || !post.message.includes(`@${me.username}`)) return;

  const prompt = stripMention(post.message, me.username);
  if (!prompt) {
    await postMessage(post.channel_id, "How can I help?", post.root_id || post.id);
    return;
  }

  console.log(`Prompt from ${post.user_id}: ${prompt}`);
  const reply = await runAgent(prompt);
  await postMessage(post.channel_id, reply, post.root_id || post.id);
}

async function connect(me) {
  const ws = new WebSocket(wsUrl);
  let seq = 1;

  ws.on("open", () => {
    ws.send(
      JSON.stringify({
        seq: seq++,
        action: "authentication_challenge",
        data: { token: TOKEN },
      }),
    );
    console.log("WebSocket connected.");
  });

  ws.on("message", async (raw) => {
    let event;
    try {
      event = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (event.event !== "posted") return;
    try {
      const post = JSON.parse(event.data.post);
      await handlePost(me, post);
    } catch (err) {
      console.error("Error handling post:", err.message);
    }
  });

  ws.on("close", () => {
    console.warn("WebSocket closed; reconnecting in 5s...");
    setTimeout(() => connect(me), 5000);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
    ws.close();
  });
}

async function main() {
  const me = await api("/users/me");
  console.log(`Starting Mattermost agent as @${me.username}`);
  await connect(me);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
