# storykit-mcp

> MCP server for the **StoryKit asset library** — search and embed free, generated design blocks
> (charts, widgets, illustrations, themes) straight from your editor.
> _Created with love by Story Kit._ 🍮

It wraps the free, public [StoryKit Asset API](https://asset.storykit.space/docs) as read-only MCP
tools. No API key, no account, no on-demand generation — just the thousands of already-generated
blocks, embeddable in one line with your own data via `data-sk-items`.

**Two ways to connect:**

- **Remote (recommended, no install):** point any streamable-HTTP MCP client at
  `https://asset.storykit.space/api/v1/mcp` — the same tools, hosted.
- **Local (stdio):** run this package with `npx -y storykit-mcp`.

## Tools

| Tool | What it does |
|------|--------------|
| `search_assets` | Search by text + kind (`CHART_VARIANT`, `COMPONENT`, `INTERACTIVE`, `THEME`, …). `INTERACTIVE` = draggable knobs/gauges/faders, skeuomorphic controls, blueprint cutaways, maps, quizzes. Returns `dataSchema` when the asset accepts rows. |
| `get_asset` | Full JSON: descriptor, `dataSchema`, html/css/js (when self-contained), embed snippet, bundle links. |
| `get_embed_snippet` | Copy-paste `<div data-sk-asset>` + `sk-embed.js` with example `data-sk-items`. |
| `list_themes` | Published themes (palette + vibe). |
| `list_chart_families` | 65+ Datawrapper-aligned chart families → StoryKit `blockType`s. |
| `list_theme_families` | Editorial theme palette catalog. |
| `bundle_url` | `.zip` download URL for one or more assets; optional `theme` id for multi-bundle. |

## Install

### Remote (any streamable-HTTP client — nothing to install)

```bash
# Claude Code
claude mcp add --transport http storykit https://asset.storykit.space/api/v1/mcp
```

```json
{
  "mcpServers": {
    "storykit": { "url": "https://asset.storykit.space/api/v1/mcp" }
  }
}
```

### Local (stdio) — runs with `npx`, no global install needed

#### Claude Code

```bash
claude mcp add storykit -- npx -y storykit-mcp
```

#### Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "storykit": { "command": "npx", "args": ["-y", "storykit-mcp"] }
  }
}
```

#### opencode

`opencode.json`:

```json
{
  "mcp": {
    "storykit": { "type": "local", "command": ["npx", "-y", "storykit-mcp"], "enabled": true }
  }
}
```

#### Windsurf / generic MCP client

```json
{
  "mcpServers": {
    "storykit": { "command": "npx", "args": ["-y", "storykit-mcp"] }
  }
}
```

## Try it

> “Find a StoryKit column chart and embed it with my Q1–Q3 sales numbers.”
> “Search StoryKit for a stat-row component and give me the embed snippet with `data-sk-items`.”
> “List chart families and pick a dumbbell plot skin.”

## Examples (curl equivalents)

```bash
# Search bar charts
curl -s "https://asset.storykit.space/api/v1/assets?kind=CHART_VARIANT&q=bar&size=5"

# Full asset + dataSchema
curl -s "https://asset.storykit.space/api/v1/assets/1757"

# Chart families catalog
curl -s "https://asset.storykit.space/api/v1/chart-families"

# Multi-bundle with theme
# → https://asset.storykit.space/api/v1/bundle.zip?ids=1757,1760&theme=1756
```

Embed with your data:

```html
<div data-sk-asset="1757"
     data-sk-items='[{"label":"Q1","value":64},{"label":"Q2","value":41}]'></div>
<script src="https://asset.storykit.space/sk-embed.js" async></script>
```

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
