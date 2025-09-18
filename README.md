<div align="center">
  <a href="https://pageindex.ai/mcp">
    <img src="https://docs.pageindex.ai/images/general/mcp_banner.jpg">
  </a>
</div>

# PageIndex MCP

[![PageIndex MCP Homepage](https://img.shields.io/badge/PageIndex_MCP_Homepage-4280d3?style=for-the-badge&logo=readthedocs&logoColor=white)](https://pageindex.ai/mcp)

Want to chat with PDF on Claude but got limit reached error? You can add your file to PageIndex to seamlessly chat with long PDFs on your Claude desktop.

- Support local and online PDFs
- Free 1000 pages
- Unlimited conversations

For more information about PageIndex MCP, check out the [PageIndex MCP](https://pageindex.ai/mcp) project page.


<p align="center">
  <a href="https://pageindex.ai/mcp">
    <img src="https://github.com/user-attachments/assets/d807d506-131d-4c7b-837c-96ab1adb2271">
  </a>
</p>
  

# What is PageIndex?

<div align="center">
  <a href="https://pageindex.ai/mcp">
    <img src="https://docs.pageindex.ai/images/cookbook/vectorless-rag.png" width="80%">
  </a>
</div>

PageIndex is a vectorless **reasoning-based RAG** system which uses multi-step reasoning and tree search to retrieve information like a human expert would. It has the following properties:

- **Higher Accuracy**: Relevance beyond similarity -
- **Better Transparency**: Clear reasoning trajectory with traceable search paths
- **Like A Human**: Retrieve information like a human expert navigates documents
- **No Vector DB**: No extra infrastructure overhead
- **No Chunking**: Preserve full document context and structure
- **No Top-K**: Retrieve all relevant passages automatically


---
# PageIndex MCP Setup 
See [PageIndex MCP](https://pageindex.ai/mcp) for full video guidances.

### 1. For Claude Desktop (Recommended)

**One-Click Installation with Desktop Extension (DXT):**

1. Download the latest `.dxt` file from [Releases](https://github.com/VectifyAI/pageindex-mcp/releases)
2. Double-click the `.dxt` file to install automatically in Claude Desktop
3. The OAuth authentication will be handled automatically when you first use the extension

This is the easiest way to get started with PageIndex's reasoning-based RAG capabilities.

### 2. For Other MCP-Compatible Clients

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



## License

This project is licensed under the terms of the MIT open source license. Please refer to [MIT](./LICENSE) for the full terms.
