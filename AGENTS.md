# Token Efficiency Rules

- Be concise — answer in 1-4 lines unless asked for details
- No code explanations or summaries unless requested
- No greetings, farewells, or preamble
- Use the smallest viable tool for each task
- Prefer batch tool calls (parallel) over sequential
- Avoid unnecessary file reads — use grep/glob first
- No comments in code unless explicitly asked

# Credentials

- GitHub auth comes from `GITHUB_TOKEN` (and `GH_TOKEN` for the `gh` CLI) in the environment or root `.env`
- Never print, log, or commit token values; `.env` is gitignored, `.env.example` lists the names
- Setup steps: `GITHUB-TOKEN-SETUP.md`
