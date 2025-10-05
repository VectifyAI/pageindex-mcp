<div align="center">
  <a href="https://pageindex.ai/mcp">
    <img src="https://docs.pageindex.ai/images/general/mcp_banner.jpg">
  </a>
</div>

# PageIndex MCP

[![PageIndex MCP Home](https://img.shields.io/badge/PageIndex_MCP_Home-4280d3?style=for-the-badge&logo=readthedocs&logoColor=white)](https://pageindex.ai/mcp)&nbsp;&nbsp;[![PageIndex Home](https://img.shields.io/badge/PageIndex_Home-3B82F6?style=for-the-badge&logo=homeadvisor&logoColor=white)](https://vectify.ai/pageindex)

[**PageIndex**](https://github.com/VectifyAI/PageIndex) is a vectorless, reasoning-based RAG system that represents documents as **hierarchical tree structures**. It enables LLMs to navigate and retrieve information through structure and **reasoning**, not vector similarity — much like a human would.

[**PageIndex MCP**](https://pageindex.ai/mcp) exposes this LLM-native tree index directly to agents and LLMs via MCP, allowing platforms like **Claude**, **Cursor**, and other MCP-compatible agents or LLMs to reason over document structure and retrieve information natively — without vector databases.

Want to chat with long PDFs but hit context limit reached errors? Add your file to PageIndex to seamlessly chat with long PDFs on any agent/LLM platforms.

✨ Chat to long PDFs the **human-like, reasoning-based way** ✨

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

PageIndex is a vectorless, **reasoning-based RAG** system that generates hierarchical **tree structures** of documents and uses multi-step **reasoning** and tree search to retrieve information like a human expert would. It has the following key properties:

- **Higher Accuracy**: Relevance beyond similarity
- **Better Transparency**: Clear reasoning trajectory with traceable search paths
- **Like A Human**: Retrieve information like a human expert navigates documents
- **No Vector DB**: No extra infrastructure overhead
- **No Chunking**: Preserve full document context and structure
- **No Top-K**: Retrieve all relevant passages automatically


---
# PageIndex MCP Setup 
See [PageIndex MCP](https://pageindex.ai/mcp) for full video guidances.

### 1. For Claude Desktop (Recommended)

**One-Click Installation with Desktop Extension (MCPB):**

1. Download the latest `.mcpb` file from [Releases](https://github.com/VectifyAI/pageindex-mcp/releases)
2. Double-click the `.mcpb` file to install automatically in Claude Desktop
3. The OAuth authentication will be handled automatically when you first use the extension

> **Note**: Claude Desktop Extensions now use the `.mcpb` (MCP Bundle) file extension. Existing `.dxt` extensions will continue to work, but we recommend using `.mcpb` for new installations.

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

# Related Links

[![PageIndex Home](https://img.shields.io/badge/PageIndex_Home-3B82F6?style=for-the-badge&logo=homeadvisor&logoColor=white)](https://vectify.ai/pageindex)&nbsp;&nbsp;
[![PageIndex GitHub](https://img.shields.io/badge/PageIndex_GitHub-000000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/VectifyAI/PageIndex)

## License

This project is licensed under the terms of the MIT open source license. Please refer to [MIT](./LICENSE) for the full terms.
