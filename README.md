# storykit-mcp

**Give your AI a design library and a printing press.**

An MCP server for [StoryKit](https://storykit.space) — search a free library of generated design
blocks (charts, animated widgets, illustrations, themes) and embed them anywhere with one line,
**or let your AI author a whole interactive visual essay and publish it on storykit.space — no API
key, no signup.** _Created with love by Story Kit._ 🍮

<p align="center">
  <img src="https://raw.githubusercontent.com/aryan0078/storykit-mcp/main/assets/asset-3174.png" width="46%" alt="A StoryKit EQ-curve widget with the default paper theme">
  <img src="https://raw.githubusercontent.com/aryan0078/storykit-mcp/main/assets/asset-themed.png" width="46%" alt="The same widget re-inked gold on dark via URL theme params">
</p>
<p align="center"><em>The same live asset, re-inked per page with two URL params — no CSS written.</em></p>

## Install

**Remote (recommended — no install):**

```bash
claude mcp add --transport http storykit https://asset.storykit.space/api/v1/mcp
```

**Local (stdio):**

```bash
claude mcp add storykit -- npx -y storykit-mcp
```

Cursor / Hermes / Kiro / opencode / Antigravity / Windsurf configs: see the
[setup guide](https://asset.storykit.space/mcp).

## What your AI can do with it

### 1 · Embed free design blocks (no key)

```
"Find a StoryKit column chart and embed it with Q1–Q3 sales."
```

Your AI searches the library, then drops one line into your page:

```html
<div data-sk-asset="1757"
     data-sk-items='[{"label":"Q1","value":64},{"label":"Q2","value":41}]'
     data-sk-accent="#b8860b" data-sk-paper="#14110b"></div>
<script src="https://asset.storykit.space/sk-embed.js" async></script>
```

Data via `data-sk-items`; colors via `data-sk-accent/paper/ink/surface/accent2`. Sandboxed,
always up-to-date, zero CSS to maintain.

<p align="center">
  <img src="https://raw.githubusercontent.com/aryan0078/storykit-mcp/main/assets/asset-knob.png" width="46%" alt="A drag-interactable rotary knob widget from the library">
  <img src="https://raw.githubusercontent.com/aryan0078/storykit-mcp/main/assets/asset-3172.png" width="46%" alt="An animated interactive widget from the library">
</p>

### 2 · Publish a visual essay authored by YOUR model (no key, no signup)

```
"Research the gold market and publish a StoryKit visual essay about it."
```

Your AI reads the StorySpec contract, authors the story as structured JSON (never code — visuals
come from the reviewed asset library), and imports it. Back come two links:

- **shareUrl** — the story, private, reachable only by that link
- **claimUrl** — open it and sign in at storykit.space to keep the story
  (premium accounts make it permanent, public and SEO-indexed)

Digests too: `format: "digest"` authors a prose-led briefing.

## Tools

| Tool | What it does |
| --- | --- |
| `search_assets` | Search the library by text + kind (charts, widgets, SVG, themes…) |
| `get_asset` | Full JSON for one asset: descriptor, dataSchema, embed snippet |
| `get_embed_snippet` | One-line copy-paste embed with example data |
| `list_themes` / `list_theme_families` | Published palettes for theming |
| `list_chart_families` | 65+ chart families → StoryKit blockTypes |
| `bundle_url` | .zip export of one or more assets, optionally themed |
| `get_story_contract` | The StorySpec grammar + rules for authoring |
| `import_story` | **Host your model's essay/digest — keyless, returns share + claim links** |
| `connect_account` | Optional: bind an account by email, mint a key (skips claiming) |
| `story_status` | Status + links for a keyed story |

## Environment

- `STORYKIT_API_BASE` — override the API base (default `https://asset.storykit.space`)
- `STORYKIT_API_KEY` — optional account key from `connect_account`; raises rate limits and
  pre-attaches imports to your account

## License

MIT · _Created with love by [Story Kit](https://storykit.space)._
