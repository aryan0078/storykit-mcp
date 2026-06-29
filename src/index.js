#!/usr/bin/env node
/**
 * StoryKit MCP server — Created with love by Story Kit.
 *
 * Exposes the free, public StoryKit asset API (https://asset.storykit.space/api/v1) to any MCP
 * client (Claude Code, Cursor, opencode, Windsurf, generic) as a handful of read-only tools, so an
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

async function api(path) {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    headers: { Accept: 'application/json', ...(API_KEY ? { 'X-API-Key': API_KEY } : {}) },
  })
  if (res.status === 429) {
    const retry = res.headers.get('Retry-After') || '60'
    throw new Error(`Rate limited by StoryKit — retry in ${retry}s, or set STORYKIT_API_KEY for a higher limit.`)
  }
  if (!res.ok) throw new Error(`StoryKit API ${res.status} for ${path}`)
  return res.json()
}

const text = (obj) => ({ content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2) }] })
const fail = (e) => ({ isError: true, content: [{ type: 'text', text: `Error: ${e.message || e}` }] })

const server = new McpServer({ name: 'storykit', version: '0.1.0' })

server.tool(
  'search_assets',
  'Search the StoryKit design library. Returns matching blocks (id, name, kind, embed snippet). '
    + 'Kinds: CHART_VARIANT, ANIMATION, TEXT_STYLE, THEME, COMPONENT, SVG, INTERACTIVE.',
  {
    query: z.string().optional().describe('free text, e.g. "radial gauge" or "comparison"'),
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
        selfContained: !!(a.html || a.js), embed: a.embed?.snippet,
      }))
      return text({ total: data.totalElements, page: data.number, totalPages: data.totalPages, results: slim })
    } catch (e) { return fail(e) }
  },
)

server.tool(
  'get_asset',
  'Get the full JSON for one asset by id: descriptor, and html/css/js when it is self-contained, '
    + 'plus the one-line embed snippet and iframe.',
  { id: z.number().int().describe('asset id from search_assets') },
  async ({ id }) => {
    try { return text(await api(`/assets/${id}`)) } catch (e) { return fail(e) }
  },
)

server.tool(
  'get_embed_snippet',
  'Get just the copy-paste embed snippet for an asset — a <div data-sk-asset> + the hosted runtime '
    + 'script. Drop it into any HTML page.',
  { id: z.number().int() },
  async ({ id }) => {
    try {
      const a = await api(`/assets/${id}`)
      return text(a.embed?.snippet || a.embed?.iframe || 'No embed available.')
    } catch (e) { return fail(e) }
  },
)

server.tool(
  'list_themes',
  'List published StoryKit themes (palette + vibe) for the theme engine / composing a page.',
  {},
  async () => {
    try { return text((await api('/themes')).content || []) } catch (e) { return fail(e) }
  },
)

server.tool(
  'bundle_url',
  'Build a download URL for a zip bundle of one or more assets (each as a standalone index.html '
    + 'plus a composed page).',
  { ids: z.array(z.number().int()).min(1).max(25) },
  async ({ ids }) => {
    const url = ids.length === 1
      ? `${API_BASE}/api/v1/assets/${ids[0]}/bundle.zip`
      : `${API_BASE}/api/v1/bundle.zip?ids=${ids.join(',')}`
    return text({ url, note: 'Created with love by Story Kit.' })
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
