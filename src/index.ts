interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * MyGene.info MCP.
 * Docs: https://docs.mygene.info/en/latest/
 */


const BASE = 'https://mygene.info/v3';
const UA = 'pipeworx-mcp-mygene-info/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'query',
    description: 'Full-text gene query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'e.g. "BRCA1", "symbol:TP53 AND taxid:9606"' },
        species: { type: 'string', description: 'NCBI taxonomy id or common name (default human).' },
        fields: { type: 'string', description: 'Comma-sep return fields.' },
        size: { type: 'number', description: '1-1000 (default 10).' },
        sort: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'gene',
    description: 'Annotations for a single gene id.',
    inputSchema: {
      type: 'object',
      properties: {
        gene_id: { type: 'string', description: 'Entrez id ("7157") or Ensembl id ("ENSG00000141510").' },
        fields: { type: 'string' },
        species: { type: 'string' },
      },
      required: ['gene_id'],
    },
  },
  {
    name: 'query_many',
    description: 'Batch lookup (POST).',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        scopes: { type: 'string', description: 'Comma-sep fields to search in (default symbol).' },
        species: { type: 'string' },
        fields: { type: 'string' },
      },
      required: ['ids'],
    },
  },
  {
    name: 'metadata',
    description: 'Release / source metadata.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'taxonomy',
    description: 'Species taxonomy info.',
    inputSchema: {
      type: 'object',
      properties: { species: { type: 'string' } },
      required: ['species'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'query': {
      const p = new URLSearchParams({
        q: reqStr(args, 'query', '"BRCA1"'),
        size: String(Math.min(1000, Math.max(1, (args.size as number) ?? 10))),
      });
      if (args.species) p.set('species', String(args.species));
      if (args.fields) p.set('fields', String(args.fields));
      if (args.sort) p.set('sort', String(args.sort));
      return mGet(`/query?${p}`);
    }
    case 'gene': {
      const p = new URLSearchParams();
      if (args.fields) p.set('fields', String(args.fields));
      if (args.species) p.set('species', String(args.species));
      const qs = p.toString() ? `?${p}` : '';
      return mGet(`/gene/${encodeURIComponent(reqStr(args, 'gene_id', '"7157"'))}${qs}`);
    }
    case 'query_many': {
      const ids = reqArr(args, 'ids', '["BRCA1","TP53"]');
      const body: Record<string, string> = {
        q: ids.join(','),
        scopes: String(args.scopes ?? 'symbol'),
      };
      if (args.species) body.species = String(args.species);
      if (args.fields) body.fields = String(args.fields);
      const res = await fetch(`${BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'User-Agent': UA },
        body: new URLSearchParams(body),
      });
      if (!res.ok) throw new Error(`MyGene: ${res.status}`);
      return res.json();
    }
    case 'metadata':
      return mGet('/metadata');
    case 'taxonomy':
      return mGet(`/species/${encodeURIComponent(reqStr(args, 'species', '"9606"'))}`);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function mGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (res.status === 404) throw new Error('MyGene: not found');
  if (!res.ok) throw new Error(`MyGene: ${res.status}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

function reqArr(args: Record<string, unknown>, key: string, example: string): string[] {
  const v = args[key];
  if (!Array.isArray(v) || v.length === 0) throw new Error(`Required argument "${key}" must be a non-empty array, e.g. ${example}.`);
  return v.filter((s): s is string => typeof s === 'string' || typeof s === 'number').map(String);
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
