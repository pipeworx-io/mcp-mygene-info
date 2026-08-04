# @pipeworx/mygene-info

[MyGene.info](https://mygene.info) MCP — gene annotation service from BioThings (NCBI, Ensembl, UniProt, KEGG, OMIM, etc., joined per gene). Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `query(query, species?, fields?, size?, sort?)` — full-text gene query
- `gene(gene_id, fields?, species?)` — annotations for a gene id (Entrez or Ensembl)
- `query_many(ids, scopes?, species?, fields?)` — batch lookup
- `metadata()` — release / source metadata
- `taxonomy(species)` — species taxonomy info

## Data source

`https://mygene.info/v3/`

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "mygene-info": {
      "url": "https://gateway.pipeworx.io/mygene-info/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Mygene Info data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
