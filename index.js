import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE_URL = "https://bananaprompts.fun/api/prompts";
const WEB_BASE_URL = "https://bananaprompts.fun";

const server = new Server(
  {
    name: "banana-prompts-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_prompts_by_tags",
        description: "Search for AI art prompts on Banana Prompts by one or more tags.",
        inputSchema: {
          type: "object",
          properties: {
            tags: {
              type: "array",
              items: { type: "string" },
              description: "An array of tags to search for (e.g., ['portrait', 'cyberpunk'])",
            },
            page: {
              type: "number",
              description: "Page number for pagination (default: 1)",
            },
          },
          required: ["tags"],
        },
      },
      {
        name: "search_prompts_by_query",
        description: "Search for AI art prompts on Banana Prompts using a general search query.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search terms (e.g., 'futuristic city')",
            },
            page: {
              type: "number",
              description: "Page number for pagination (default: 1)",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_prompts_by_tags") {
      const tags = args.tags;
      const page = args.page || 1;
      const tagsQuery = tags.join(",");
      const url = `${API_BASE_URL}/search?tags=${encodeURIComponent(tagsQuery)}&page=${page}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      return formatResults(data.data);

    } else if (name === "search_prompts_by_query") {
      const query = args.query;
      const page = args.page || 1;
      const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      return formatResults(data.data);

    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Format API results for MCP output
 */
function formatResults (prompts) {
  if (!prompts || prompts.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No prompts found matching your criteria. Visit https://bananaprompts.fun to explore more.",
        },
      ],
    };
  }

  const formattedContent = prompts.map((prompt) => {
    const promptUrl = `${WEB_BASE_URL}/prompt/${prompt.slug}`;
    return `### ${prompt.title}\n\n**Prompt:**\n${prompt.content}\n\n**Tags:** ${prompt.tags}\n\n[View on Banana Prompts](${promptUrl})\n\n---`;
  }).join("\n\n");

  return {
    content: [
      {
        type: "text",
        text: `Found ${prompts.length} prompts:\n\n${formattedContent}\n\nExplore thousands more at [Banana Prompts](https://bananaprompts.fun).`,
      },
    ],
  };
}

/**
 * Start the server
 */
async function main () {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Banana Prompts MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
