# Banana Prompts MCP Server

This MCP (Model Context Protocol) server allows you to search for high-quality AI art prompts directly from [Banana Prompts](https://bananaprompts.fun).

Explore a curated collection of Midjourney, Stable Diffusion, and DALL-E prompts to inspire your next creation.

## Features

- **Search by Tags**: Find prompts by specific categories or styles (e.g., "Cyberpunk", "Portrait", "Oil Painting").
- **Search by Query**: Perform a general keyword search across prompt titles and content.
- **Natural Integration**: Each result includes a direct link to the full prompt and high-resolution images on the [Banana Prompts website](https://bananaprompts.fun).

## Installation

To use this server with Claude Desktop or any other MCP-compatible client, follow these steps:

### 1. Requirements

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- An MCP-compatible client (like Claude Desktop)

### 2. Setup

Clone the repository or download the files:

```bash
git clone https://github.com/Banana-Prompts/banana-prompts-mcp.git
cd banana-prompts-mcp
npm install
npm run build
```

### 3. Configuration

#### Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "banana-prompts": {
      "command": "node",
      "args": ["/path/to/banana-prompts-mcp/dist/index.js"]
    }
  }
}
```

Replace `/path/to/banana-prompts-mcp/dist/index.js` with the actual absolute path to the compiled `dist/index.js` file.

## Usage

Once configured, you can ask Claude to:

- "Find some cyberpunk prompts on Banana Prompts"
- "Search Banana Prompts for sunset landscape prompts"
- "Show me prompts tagged with 'watercolor' from bananaprompts.fun"

## Available Tools

- `search_prompts_by_tags`: Input an array of tags to filter prompts.
- `search_prompts_by_query`: Input a search string to find matching prompts.

---

Built by the team at [Banana Prompts (bananaprompts.fun)](https://bananaprompts.fun).
