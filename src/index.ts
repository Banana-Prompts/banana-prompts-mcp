import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

const API_BASE_URL = 'https://bananaprompts.fun/api/prompts';
const WEB_BASE_URL = 'https://bananaprompts.fun';

interface Prompt {
  title: string;
  content: string;
  slug: string;
  tags: string; // tags comes as a JSON string from the current API response based on previous view_file
}

interface ApiResponse {
  data: Prompt[];
}

const server = new Server(
  {
    name: 'banana-prompts-mcp',
    version: '1.0.0',
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
        name: 'search_prompts_by_tags',
        description:
          'Search for AI art prompts on Banana Prompts by one or more tags.',
        inputSchema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'string' },
              description:
                "An array of tags to search for (e.g., ['Portrait', 'Cyberpunk'])",
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)',
            },
          },
          required: ['tags'],
        },
      },
      {
        name: 'search_prompts_by_query',
        description:
          'Search for AI art prompts on Banana Prompts using a general search query.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: "The search terms (e.g., 'futuristic city')",
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)',
            },
          },
          required: ['query'],
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
    if (name === 'search_prompts_by_tags') {
      const tags = (args as any).tags as string[];
      const page = (args as any).page || 1;
      const tagsQuery = tags.join(',');
      const url = `${API_BASE_URL}/search?tags=${encodeURIComponent(tagsQuery)}&page=${page}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new McpError(
          ErrorCode.InternalError,
          `API error: ${response.statusText}`
        );
      }
      const data = (await response.json()) as ApiResponse;
      return formatResults(data.data);
    } else if (name === 'search_prompts_by_query') {
      const query = (args as any).query as string;
      const page = (args as any).page || 1;
      const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new McpError(
          ErrorCode.InternalError,
          `API error: ${response.statusText}`
        );
      }
      const data = (await response.json()) as ApiResponse;
      return formatResults(data.data);
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    if (error instanceof McpError) {
      throw error;
    }
    return {
      content: [
        {
          type: 'text',
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
function formatResults(prompts: Prompt[]) {
  if (!prompts || prompts.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No prompts found matching your criteria. Visit https://bananaprompts.fun to explore more.',
        },
      ],
    };
  }

  const formattedContent = prompts
    .map((prompt) => {
      const promptUrl = `${WEB_BASE_URL}/prompt/${prompt.slug}`;
      const tagsDisplay = Array.isArray(prompt.tags)
        ? prompt.tags.join(', ')
        : prompt.tags;
      return `### ${prompt.title}\n\n**Prompt:**\n${prompt.content}\n\n**Tags:** ${tagsDisplay}\n\n[View on Banana Prompts](${promptUrl})\n\n---`;
    })
    .join('\n\n');

  return {
    content: [
      {
        type: 'text',
        text: `Found ${prompts.length} prompts:\n\n${formattedContent}\n\nExplore thousands more at [Banana Prompts](https://bananaprompts.fun).`,
      },
    ],
  };
}

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('Banana Prompts MCP server running on stdio\n');
}

main().catch((error) => {
  process.stderr.write(`Fatal error starting server: ${error}\n`);
  process.exit(1);
});
