import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

class MCPManager {
  constructor() {
    this.clients = {}; // serviceName -> Client instance
    this.tools = []; // aggregated list of discovered tools
  }

  // Connect to an MCP server via SSE transport
  async connectService(serviceName, urlString) {
    if (!urlString) throw new Error("URL is required");
    try {
      // Close existing connection if any
      if (this.clients[serviceName]) {
        await this.disconnectService(serviceName);
      }

      const transport = new SSEClientTransport(new URL(urlString));
      const client = new Client({ name: `Divya-${serviceName}-Client`, version: "1.0.0" });
      await client.connect(transport);
      this.clients[serviceName] = client;
      await this.refreshTools();
      return true;
    } catch (err) {
      console.error(`[MCP] Failed to connect to ${serviceName}:`, err);
      throw err;
    }
  }

  // Disconnect from an MCP server
  async disconnectService(serviceName) {
    if (this.clients[serviceName]) {
      try {
        await this.clients[serviceName].close();
      } catch (e) {
        console.error(`[MCP] Error closing ${serviceName}:`, e);
      }
      delete this.clients[serviceName];
      await this.refreshTools();
    }
  }

  // Refresh and aggregate all tools from active clients
  async refreshTools() {
    let allTools = [];
    for (const [service, client] of Object.entries(this.clients)) {
      try {
        const response = await client.listTools();
        if (response && response.tools) {
          const formatted = response.tools.map(tool => ({
            ...tool,
            _mcpService: service // track which client owns this tool
          }));
          allTools = [...allTools, ...formatted];
        }
      } catch (err) {
        console.error(`[MCP] Error listing tools from ${service}:`, err);
      }
    }
    this.tools = allTools;
  }

  // Translate discovered MCP tools to Gemini-compatible function declarations
  getGeminiTools() {
    if (this.tools.length === 0) return null;

    const functionDeclarations = this.tools.map(tool => {
      const parameters = tool.inputSchema || { type: "object", properties: {} };
      
      // Map lowercase schema types to Gemini uppercase types recursively
      const formatSchema = (schema) => {
        if (!schema) return schema;
        const formatted = { ...schema };
        
        // Remove $schema which causes Gemini payload rejection
        if ('$schema' in formatted) {
          delete formatted['$schema'];
        }
        
        if (formatted.type && typeof formatted.type === "string") {
          formatted.type = formatted.type.toUpperCase();
        }
        if (formatted.properties) {
          const props = {};
          for (const [k, v] of Object.entries(formatted.properties)) {
            const childSchema = formatSchema(v);
            if (childSchema && typeof childSchema === 'object' && '$schema' in childSchema) {
              delete childSchema['$schema'];
            }
            props[k] = childSchema;
          }
          formatted.properties = props;
        }
        if (formatted.items) {
          formatted.items = formatSchema(formatted.items);
        }
        return formatted;
      };

      return {
        name: tool.name,
        description: tool.description,
        parameters: formatSchema(parameters)
      };
    });

    return [{ functionDeclarations }];
  }

  // Execute a tool requested by Gemini
  async executeTool(name, args) {
    const tool = this.tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Tool ${name} not found in discovered MCP tools.`);
    }

    const client = this.clients[tool._mcpService];
    if (!client) {
      throw new Error(`MCP Client for service ${tool._mcpService} is not connected.`);
    }

    const result = await client.callTool({ name, arguments: args });
    return result;
  }
}

export const mcpManager = new MCPManager();
