# PageIndex MCP

A Model Context Protocol (MCP) server for **PageIndex** - Next-Generation Reasoning-based RAG.

## What is PageIndex?

PageIndex is a revolutionary document processing system that uses **reasoning-based RAG** instead of traditional vector-based similarity search. Unlike conventional RAG systems that rely on semantic similarity, PageIndex uses multi-step reasoning and tree search to retrieve information like a human expert would.

### Key Advantages over Vector-based RAG

- **Higher Accuracy**: Relevance beyond similarity - ideal for domain-specific documents where semantics are similar
- **Better Transparency**: Clear reasoning trajectory with traceable search paths
- **Like A Human**: Retrieve information like a human expert navigates documents
- **No Vector DB**: No extra infrastructure overhead
- **No Chunking**: Preserve full document context and structure
- **No Top-K**: Retrieve all relevant passages automatically

## Architecture

This MCP server acts as a bridge between Claude/LLM clients and the PageIndex platform:

```
[Claude/LLM] <--> [PageIndex MCP Server] <--> [PageIndex MCP API]
                         |
                         ├── process_document (local file handling)
                         │   ├── Uploads to PageIndex via signed URLs
                         │   └── Processes with PageIndex OCR + Tree Generation
                         └── Other tools (proxy to PageIndex MCP API)
```

## Features

- **Local PDF Processing**: Upload local PDF files directly without manual uploads
- **URL Support**: Process documents from URLs
- **Full PageIndex Integration**: Access all PageIndex capabilities (OCR, tree generation, reasoning-based retrieval)
- **Secure Authentication**: API key authentication with PageIndex platform
- **TypeScript**: Full type safety with MCP SDK
- **Claude Desktop Ready**: Easy integration with Claude Desktop

## Usage

### Getting Started

First, you'll need to create an API key:

1. Visit https://dash.pageindex.ai/api-keys
2. Create a new API key for your application
3. Copy the API key for use in the configuration below

#### Option 1: Local MCP Server (with local PDF upload)

**Requirements:** Node.js ≥18.0.0

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "pageindex": {
      "command": "npx",
      "args": ["-y", "pageindex-mcp"],
      "env": {
        "PAGEINDEX_API_KEY": "<YOUR_PAGEINDEX_API_KEY>"
      }
    }
  }
}
```

### Option 2: Remote MCP Server

Alternatively, connect directly to PageIndex without this wrapper:

```json
{
  "mcpServers": {
    "pageindex": {
      "type": "http",
      "url": "https://dash.pageindex.ai/api/mcp/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_PAGEINDEX_API_KEY>"
      }
    }
  }
}
```

> **Note**: Option 1 provides local PDF upload capabilities, while Option 2 connects directly to PageIndex but requires manual PDF uploads via the dashboard.

## Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| **process_document** | Upload and process PDF documents with PageIndex OCR and tree generation | `url` - Local file path or PDF URL |
| **ask_document** | Query documents using natural language with reasoning-based retrieval | `doc_id`, `query`, `thinking` (optional) |
| **get_page_content** | Extract specific page content from processed documents | `doc_id`, `pages` ("5", "3-7", "1,5,10") |
| **get_document_structure** | Extract hierarchical document structure with configurable detail levels | `doc_id`, `mode` ("summary", "outline", "full"), `max_depth` (1-10) |
| **list_documents** | List documents with comprehensive status information | `status`, `limit`, `offset` (all optional) |
| **remove_document** | Permanently delete documents and associated data | `doc_ids` (array of document IDs) |
| **search_documents** | Search document library using keywords | `query`, `status`, `limit` (optional) |

> **Quick Example**: Process a local PDF with `process_document`, then query it with `ask_document` using the returned document ID.

## License
This project is licensed under the terms of the MIT open source license. Please refer to [MIT](./LICENSE) for the full terms.
