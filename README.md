<div align="center">
  <a href="https://pageindex.ai/mcp">
    <img src="https://docs.pageindex.ai/images/general/mcp_banner.jpg">
  </a>
</div>

# PageIndex MCP

A Model Context Protocol (MCP) server for **PageIndex** - Next-Generation Reasoning-based RAG.

For an overview and quick start, check out the [PageIndex MCP](https://pageindex.ai/mcp) project page.

## What is PageIndex?

<div align="center">
  <a href="https://pageindex.ai/mcp">
    <img src="https://docs.pageindex.ai/images/cookbook/vectorless-rag.png" width="80%">
  </a>
</div>

PageIndex is a revolutionary document processing system that uses **reasoning-based RAG** instead of traditional vector-based similarity search. Unlike conventional RAG systems that rely on semantic similarity, PageIndex uses multi-step reasoning and tree search to retrieve information like a human expert would.

### Key Advantages over Vector-based RAG

- **Higher Accuracy**: Relevance beyond similarity - ideal for domain-specific documents where semantics are similar
- **Better Transparency**: Clear reasoning trajectory with traceable search paths
- **Like A Human**: Retrieve information like a human expert navigates documents
- **No Vector DB**: No extra infrastructure overhead
- **No Chunking**: Preserve full document context and structure
- **No Top-K**: Retrieve all relevant passages automatically

## Features

- **Local PDF Processing**: Upload local PDF files directly without manual uploads
- **URL Support**: Process documents from URLs
- **Full PageIndex Integration**: Access all PageIndex capabilities (OCR, tree generation, reasoning-based retrieval)
- **Secure OAuth Authentication**: OAuth 2.1 with PKCE and automatic token refresh
- **TypeScript**: Full type safety with MCP SDK
- **Desktop Extension (DXT)**: One-click installation for Claude Desktop with secure configuration

## Usage

### Getting Started

The PageIndex MCP server uses OAuth 2.1 authentication for secure access. When you first run the server, it will guide you through the authentication process by opening your browser to authorize the application.

### For Claude Desktop (Recommended)

**One-Click Installation with Desktop Extension (DXT):**

1. Download the latest `.dxt` file from [Releases](https://github.com/VectifyAI/pageindex-mcp/releases)
2. Double-click the `.dxt` file to install automatically in Claude Desktop
3. The OAuth authentication will be handled automatically when you first use the extension

**Benefits of DXT Installation:**

- **No technical setup** - just download and double-click
- **Secure OAuth authentication** - handled automatically through your browser
- **Automatic updates** - extensions update seamlessly
- **Full local PDF support** - upload and process PDFs directly from your computer

This is the easiest way to get started with PageIndex's reasoning-based RAG capabilities.

### For Other MCP-Compatible Clients

#### Option 1: Local MCP Server (with local PDF upload)

**Requirements:** Node.js ≥18.0.0

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "pageindex": {
      "command": "npx",
      "args": ["-y", "pageindex-mcp"]
    }
  }
}
```

**Authentication Process:**
1. When you first connect, the server will automatically open your browser for OAuth authentication
2. Log in to your PageIndex account and authorize the application
3. The authentication tokens are securely stored locally and automatically refreshed
4. Subsequent connections will use the stored credentials automatically

> **Note**: This local server provides full PDF upload capabilities and handles all authentication automatically.

#### Option 2: Direct Connection to PageIndex

Connect directly to the PageIndex OAuth-enabled MCP server:

```json
{
  "mcpServers": {
    "pageindex": {
      "type": "http",
      "url": "https://mcp.pageindex.ai/mcp"
    }
  }
}
```

**Authentication Process:**
1. The MCP client will automatically handle the OAuth flow
2. You'll be redirected to authorize the application in your browser
3. Authentication tokens are managed by the MCP client

**For clients that don't support HTTP MCP servers:**

If your MCP client doesn't support HTTP servers directly, you can use [mcp-remote](https://github.com/geelen/mcp-remote) as a bridge:

```json
{
  "mcpServers": {
    "pageindex": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.pageindex.ai/mcp"]
    }
  }
}
```

> **Note**: Option 1 provides local PDF upload capabilities, while Option 2 only supports PDF processing via URLs (no local file uploads).

## Available Tools

| Tool                       | Description                                                                                      | Key Parameters                           |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| **process_document**       | Upload and process PDF documents from local files or URLs with PageIndex OCR and tree generation | `url` - Local file path or PDF URL       |
| **recent_documents**       | Get recent documents with status overview                                                        | `limit` (optional)                       |
| **get_document**           | Get basic document info and status                                                               | `doc_id`                                 |
| **get_document_structure** | Extract hierarchical document structure with configurable detail levels                          | `doc_id`, `max_depth` (1-10)             |
| **get_page_content**       | Extract specific page content from processed documents                                           | `doc_id`, `pages` ("5", "3-7", "1,5,10") |
| **remove_document**        | Permanently delete documents and associated data                                                 | `doc_ids` (array of document IDs)        |

> **Quick Example**: Process a local PDF with `process_document`, then extract content with `get_page_content` using the returned document ID.

## License

This project is licensed under the terms of the MIT open source license. Please refer to [MIT](./LICENSE) for the full terms.
