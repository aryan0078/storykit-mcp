#!/usr/bin/env node
/**
 * StoryKit MCP server — Created with love by Story Kit.
 *
 * Exposes the free, public StoryKit asset API (https://asset.storykit.space/api/v1) to any MCP
 * client (Claude Code, Cursor, opencode, Windsurf, generic) as read-only tools, so an
 * AI assistant can search the design library and drop ready-made, embeddable blocks into a project.
 *
 * Read-only. No API key required. No on-demand generation (that stays on the website roadmap).
 * Override the API base with STORYKIT_API_BASE; pass a higher-limit key via STORYKIT_API_KEY.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_BASE = (process.env.STORYKIT_API_BASE || 'https://asset.storykit.space').replace(/\/+$/, '')
const API_KEY = process.env.STORYKIT_API_KEY || ''

async function api(path, body) {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (res.status === 429) {
    const retry = res.headers.get('Retry-After') || '60'
    throw new Error(`Rate limited by StoryKit — retry in ${retry}s, or set STORYKIT_API_KEY for a higher limit.`)
  }
  if (!res.ok) {
    let detail = ''
    try { detail = (await res.json()).error || '' } catch { /* non-JSON */ }
    throw new Error(`StoryKit API ${res.status} for ${path}${detail ? ` — ${detail}` : ''}`)
  }
  return res.json()
}

const text = (obj) => ({ content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2) }] })
const fail = (e) => ({ isError: true, content: [{ type: 'text', text: `Error: ${e.message || e}` }] })

const server = new McpServer({ name: 'storykit', version: '0.4.0' })

server.tool(
  'search_assets',
  'Search the StoryKit design library. Returns matching blocks (id, name, kind, blockType, embed snippet, dataSchema when the asset accepts rows). '
    + 'Kinds: CHART_VARIANT, ANIMATION, TEXT_STYLE, THEME, COMPONENT, SVG, INTERACTIVE. '
    + 'INTERACTIVE covers the animated/self-contained widgets: draggable knobs + gauges + faders, skeuomorphic controls, blueprint cutaways, maps, quizzes. '
    + 'Sort: newest (default), used, name. Paginate with page + size (max 50).',
  {
    query: z.string().optional().describe('free text, e.g. "column chart" or "stat row"'),
    kind: z.enum(['CHART_VARIANT', 'ANIMATION', 'TEXT_STYLE', 'THEME', 'COMPONENT', 'SVG', 'INTERACTIVE']).optional(),
    sort: z.enum(['newest', 'used', 'name']).optional(),
    page: z.number().int().min(0).optional(),
    size: z.number().int().min(1).max(50).optional(),
  },
  async ({ query, kind, sort, page, size }) => {
    try {
      const qs = new URLSearchParams()
      if (query) qs.set('q', query)
      if (kind) qs.set('kind', kind)
      if (sort) qs.set('sort', sort)
      qs.set('page', String(page ?? 0))
      qs.set('size', String(size ?? 12))
      const data = await api(`/assets?${qs}`)
      const slim = (data.content || []).map((a) => ({
        id: a.id, name: a.name, kind: a.kind, blockType: a.blockType,
        selfContained: !!(a.html || a.js), dataSchema: a.dataSchema ?? null,
        embed: a.embed?.snippet,
      }))
      return text({ total: data.totalElements, page: data.number, totalPages: data.totalPages, results: slim, credit: data.credit })
    } catch (e) { return fail(e) }
  },
)

server.tool(
  'get_asset',
  'Get the full JSON for one asset by id: descriptor, dataSchema (row shape for data-sk-items), html/css/js when self-contained, '
    + 'plus embed.snippet, links.embedHtml, and links.bundle.',
  { id: z.number().int().describe('asset id from search_assets') },
  async ({ id }) => {
    try { return text(await api(`/assets/${id}`)) } catch (e) { return fail(e) }
  },
)

server.tool(
  'get_embed_snippet',
  'Get the copy-paste embed snippet for an asset — a <div data-sk-asset> with example data-sk-items + the hosted sk-embed.js runtime. '
    + 'Replace data-sk-items with your rows (see dataSchema from get_asset).',
  { id: z.number().int() },
  async ({ id }) => {
    try {
      const a = await api(`/assets/${id}`)
      const out = {
        snippet: a.embed?.snippet || a.embed?.iframe || 'No embed available.',
        dataSchema: a.dataSchema ?? null,
        credit: a.credit,
      }
      return text(out)
    } catch (e) { return fail(e) }
  },
)

server.tool(
  'list_themes',
  'List published StoryKit themes (palette + vibe) for composing a page or bundle export.',
  {},
  async () => {
    try { return text(await api('/themes')) } catch (e) { return fail(e) }
  },
)

server.tool(
  'list_chart_families',
  'List Datawrapper-aligned chart families (65+) mapped to StoryKit blockTypes — each family has whenToUse, a sample variant, and sampleData. '
    + 'Search kind=CHART_VARIANT to find published skins for a family.',
  {},
  async () => {
    try { return text(await api('/chart-families')) } catch (e) { return fail(e) }
  },
)

server.tool(
  'list_theme_families',
  'List editorial theme palette families — seeded as published THEME assets for reuse in embeds and bundles.',
  {},
  async () => {
    try { return text(await api('/theme-families')) } catch (e) { return fail(e) }
  },
)

server.tool(
  'bundle_url',
  'Build a download URL for a .zip bundle of one or more assets (each as standalone index.html + asset.json, plus a composed page.html). '
    + 'Optionally pass theme id to skin the composed page.',
  {
    ids: z.array(z.number().int()).min(1).max(25),
    theme: z.number().int().optional().describe('optional THEME asset id for the composed page'),
  },
  async ({ ids, theme }) => {
    let url
    if (ids.length === 1) {
      url = `${API_BASE}/api/v1/assets/${ids[0]}/bundle.zip`
    } else {
      const qs = new URLSearchParams({ ids: ids.join(',') })
      if (theme != null) qs.set('theme', String(theme))
      url = `${API_BASE}/api/v1/bundle.zip?${qs}`
    }
    return text({ url, note: 'Created with love by Story Kit.' })
  },
)


// ---- BYOM story tools: author visual essays with YOUR model, hosted on storykit.space ----------

server.tool(
  'get_story_contract',
  'The StorySpec authoring grammar + rules for import_story: block types, the libraryWidget mechanism, '
    + 'theming, and the documented-code asset pipeline. Read this BEFORE authoring a story.',
  { topic: z.string().optional().describe('optional — ranks the block grammar for this topic') },
  async ({ topic }) => {
    try { return text(await api(`/stories/contract${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`)) } catch (e) { return fail(e) }
  },
)

server.tool(
  'import_story',
  'THE BYOM tool — host a visual essay or digest YOUR model authored, NO KEY OR SIGNUP NEEDED. '
    + 'Author StorySpec blocks (pure JSON data; visuals via standard blocks + libraryWidget requests; '
    + 'bespoke svg/interactive code only with an "asset" doc object — it is sanitized, safety-screened '
    + 'and admin-reviewed). Returns a PRIVATE shareUrl plus a claimUrl — show the user BOTH: claiming at '
    + 'storykit.space keeps the story; premium makes it permanent, public and SEO-indexed (unclaimed '
    + 'stories expire in ~30 days). Pass your research as sources so it renders as citations. '
    + 'Set format:"digest" for a prose-led briefing.',
  {
    title: z.string(),
    subtitle: z.string().optional(),
    kicker: z.string().optional(),
    topic: z.string().optional(),
    format: z.enum(['essay', 'digest']).optional(),
    theme: z.record(z.any()).optional().describe('StorySpec theme object — author it from the topic\'s world'),
    blocks: z.array(z.record(z.any())).min(1).describe('StorySpec block array (see get_story_contract)'),
    sources: z.array(z.object({ title: z.string().optional(), url: z.string() })).optional(),
    client: z.string().optional().describe('the tool making this call, e.g. claude, cursor, hermes'),
  },
  async (args) => {
    try { return text(await api('/stories/import', args)) } catch (e) { return fail(e) }
  },
)

server.tool(
  'connect_account',
  'OPTIONAL power feature: bind a StoryKit account by email (auto-signup) and mint an API key. With '
    + 'STORYKIT_API_KEY set, imports skip the claim step and land straight in the account (premium '
    + 'auto-publishes). The key is shown ONCE.',
  { email: z.string().describe('your email') },
  async ({ email }) => {
    try { return text(await api('/stories/connect', { email })) } catch (e) { return fail(e) }
  },
)

server.tool(
  'story_status',
  'Check one of your (keyed) stories: status, private share link, embed snippet, public URL when published.',
  { id: z.number().int() },
  async ({ id }) => {
    try { return text(await api(`/stories/${id}`)) } catch (e) { return fail(e) }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
