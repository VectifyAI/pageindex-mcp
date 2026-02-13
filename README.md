<div align="center">
  <a href="https://pageindex.ai/mcp">
    <img src="https://docs.pageindex.ai/images/general/mcp_banner.jpg">
  </a>
</div>

# PageIndex MCP

> If you find this repo useful, please also star our **[main PageIndex repo](https://github.com/VectifyAI/PageIndex)** ⭐

[![PageIndex GitHub](https://img.shields.io/badge/PageIndex_GitHub-000000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/VectifyAI/PageIndex)&nbsp;&nbsp;[![PageIndex MCP Home](https://img.shields.io/badge/PageIndex_MCP-4280d3?style=for-the-badge&logo=readthedocs&logoColor=white)](https://pageindex.ai/mcp)&nbsp;&nbsp;[![PageIndex Home](https://img.shields.io/badge/PageIndex-3B82F6?style=for-the-badge&logo=homeadvisor&logoColor=white)](https://vectify.ai/pageindex)

📘 [**PageIndex**](https://github.com/VectifyAI/PageIndex) is a vectorless, reasoning-based RAG system that represents documents as hierarchical **tree structures**. It enables LLMs to navigate and retrieve information through structure and **reasoning**, not vector similarity — much like a human would retrieve information using a book's index.

🔌 [**PageIndex MCP**](https://pageindex.ai/mcp) exposes this **LLM-native, in-context tree index** directly to LLMs via MCP, allowing platforms like **Claude**, **Cursor**, and other MCP-compatible agents or LLMs to reason over document structure and retrieve the right information — without vector databases.

Want to chat with long PDFs but hit context limit reached errors? Add your file to PageIndex to seamlessly chat with long PDFs on any agent/LLM platforms.

✨ Chat to long PDFs the **human-like, reasoning-based way** ✨

- Support local and online PDFs
- Free 1000 pages
- Unlimited conversations

For more information, visit the [PageIndex MCP](https://pageindex.ai/mcp) page.

💡 Looking for a fully hosted experience? Try [**PageIndex Chat**](https://chat.pageindex.ai) 🤖: a human-like document analyst that lets you chat with long PDFs using the same agentic, reasoning-based workflow as PageIndex MCP.

<p align="center">
  <a href="https://pageindex.ai/mcp">
    <img src="https://github.com/user-attachments/assets/d807d506-131d-4c7b-837c-96ab1adb2271">
  </a>
</p>

# What is PageIndex?

<div align="center">
  <a href="https://pageindex.ai/mcp">
    <img src="https://docs.pageindex.ai/images/cookbook/vectorless-rag.png" width="70%">
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

### 1. For Developers

Connect PageIndex to your agent framework or AI SDK via MCP. Works with [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-python), [Vercel AI SDK](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools), [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/mcp/), [LangChain](https://github.com/langchain-ai/langchain-mcp-adapters), and any MCP-compatible client. Simple API Key authentication — no OAuth flow required.

1. Go to [PageIndex Dashboard](https://dash.pageindex.ai/api-keys) to create an API Key
2. Copy the generated key
3. Add to your MCP configuration:

```json
{
  "mcpServers": {
    "pageindex": {
      "type": "http",
      "url": "https://api.pageindex.ai/mcp",
      "headers": {
        "Authorization": "Bearer your_api_key"
      }
    }
  }
}
```

For more details, visit the [PageIndex API Dashboard](https://dash.pageindex.ai).

### 2. For PageIndex Chat Users

If you already have a [PageIndex Chat](https://chat.pageindex.ai) account, you can connect your MCP client directly via OAuth.

**Claude Desktop — One-Click Install:**

Download the `.mcpb` file from [Releases](https://github.com/VectifyAI/pageindex-mcp/releases) and double-click to install. OAuth authentication is handled automatically.

**Other MCP Clients:**

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

**Local MCP Server (with local PDF upload):**

If you need to upload local PDF files, you can run the local MCP server (requires Node.js ≥18.0.0):

```json
{
  "mcpServers": {
    "pageindex": {
      "command": "npx",
      "args": ["-y", "@pageindex/mcp"]
    }
  }
}
```

For more details, visit [PageIndex Chat](https://chat.pageindex.ai).

# Related Links

[![PageIndex Home](https://img.shields.io/badge/PageIndex_Home-3B82F6?style=for-the-badge&logo=homeadvisor&logoColor=white)](https://vectify.ai/pageindex)&nbsp;&nbsp;
[![PageIndex GitHub](https://img.shields.io/badge/PageIndex_GitHub-000000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/VectifyAI/PageIndex)

## License

This project is licensed under the terms of the MIT open source license. Please refer to [MIT](./LICENSE) for the full terms.
