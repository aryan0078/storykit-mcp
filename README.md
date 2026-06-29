# @storykit/mcp

> MCP server for the **StoryKit asset library** — search and embed free, generated design blocks
> (charts, widgets, illustrations, themes) straight from your editor.
> _Created with love by Story Kit._ 🍮

It wraps the free, public [StoryKit Asset API](https://asset.storykit.space/docs) as read-only MCP
tools. No API key, no account, no on-demand generation — just the thousands of already-generated
blocks, embeddable in one line.

## Tools

| Tool | What it does |
|------|--------------|
| `search_assets` | Search the library by text + kind (`CHART_VARIANT`, `INTERACTIVE`, `THEME`, …). |
| `get_asset` | Full JSON for an asset: descriptor + html/css/js (when self-contained) + embed snippet. |
| `get_embed_snippet` | Just the one-line `<div data-sk-asset>` + runtime snippet. |
| `list_themes` | Published themes (palette + vibe) for the theme engine. |
| `bundle_url` | A `.zip` download URL for one or more assets. |

## Install

It runs with `npx` — no global install needed.

### Claude Code

```bash
claude mcp add storykit -- npx -y @storykit/mcp
```

### Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "storykit": { "command": "npx", "args": ["-y", "@storykit/mcp"] }
  }
}
```

### opencode

`opencode.json`:

```json
{
  "mcp": {
    "storykit": { "type": "local", "command": ["npx", "-y", "@storykit/mcp"], "enabled": true }
  }
}
```

### Windsurf / generic MCP client

```json
{
  "mcpServers": {
    "storykit": { "command": "npx", "args": ["-y", "@storykit/mcp"] }
  }
}
```

## Try it

> “Find a StoryKit gauge chart and add it to my landing page.”
> “Search StoryKit for a comparison block and give me the embed snippet.”

## Configuration

| Env var | Default | Purpose |
|---------|---------|---------|
| `STORYKIT_API_BASE` | `https://asset.storykit.space` | Override the API origin. |
| `STORYKIT_API_KEY` | — | Optional free key for a higher rate limit ([mint one](https://asset.storykit.space/on-demand)). |

## Develop

```bash
npm install
STORYKIT_API_BASE=http://localhost:8080 npm start
```

MIT licensed. Built on the [Model Context Protocol](https://modelcontextprotocol.io).
