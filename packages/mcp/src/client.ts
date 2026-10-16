import { McpClientConfig, McpServerCapabilities, McpToolCallRequest, McpToolCallResponse } from './types';

export class OutboundMcpClient {
  private isConnected = false;
  private discoveredCapabilities: McpServerCapabilities | null = null;

  constructor(private readonly config: McpClientConfig) {}

  /**
   * Validate destination URL against SSRF rules:
   * Block private IP ranges, localhost/127.0.0.1 (unless DEV), cloud metadata services (169.254.169.254).
   */
  private validateTargetUrl(urlString: string): void {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();

    // Prevent cloud metadata service access
    if (host === '169.254.169.254' || host === 'metadata.google.internal') {
      throw new Error(`SSRF guard: Access to cloud metadata endpoint ${host} is strictly prohibited.`);
    }

    if (process.env.NODE_ENV === 'production') {
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
      ) {
        throw new Error(`SSRF guard: Access to private/internal network addresses (${host}) is blocked in production.`);
      }
    }
  }

  /**
   * Discovers tools and resources exposed by the remote MCP server.
   */
  async discover(): Promise<McpServerCapabilities> {
    if (!this.config.serverUrl) {
      throw new Error('Outbound MCP server URL is not configured.');
    }

    this.validateTargetUrl(this.config.serverUrl);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (this.config.token) {
        headers['Authorization'] = `Bearer ${this.config.token}`;
      }

      const res = await fetch(`${this.config.serverUrl}/mcp/capabilities`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(this.config.timeoutMs || 5000),
      });

      if (!res.ok) {
        throw new Error(`Remote MCP discovery failed with HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json() as McpServerCapabilities;
      this.discoveredCapabilities = data;
      this.isConnected = true;
      return data;
    } catch (err: any) {
      this.isConnected = false;
      throw new Error(`MCP Discovery error: ${err.message}`);
    }
  }

  /**
   * Call a tool on the remote MCP server, enforcing tool allowlisting.
   */
  async callTool(request: McpToolCallRequest): Promise<McpToolCallResponse> {
    if (this.config.allowedTools && this.config.allowedTools.length > 0) {
      if (!this.config.allowedTools.includes(request.tool)) {
        throw new Error(`Security policy: Tool "${request.tool}" is not in the approved allowlist.`);
      }
    }

    this.validateTargetUrl(this.config.serverUrl);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    const res = await fetch(`${this.config.serverUrl}/mcp/call`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeoutMs || 15000),
    });

    if (!res.ok) {
      throw new Error(`Remote MCP tool call failed: HTTP ${res.status}`);
    }

    return await res.json() as McpToolCallResponse;
  }

  getStatus() {
    return {
      connected: this.isConnected,
      serverUrl: this.config.serverUrl || 'not_configured',
      transport: this.config.transport,
      discoveredTools: this.discoveredCapabilities ? Object.keys(this.discoveredCapabilities.tools || {}) : [],
    };
  }
}
