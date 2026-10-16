/**
 * AIProvider interface — abstraction over OpenAI and any future providers.
 * The platform MCP adapter and explanation service use only this interface.
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  finishReason: string;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  readonly isEnabled: boolean;

  chat(messages: AIMessage[], options?: {
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<AIResponse>;

  ping(): Promise<boolean>;
}
