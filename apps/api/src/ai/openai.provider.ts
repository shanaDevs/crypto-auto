import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AIProvider, AIMessage, AIResponse } from './ai-provider.interface';

/**
 * OpenAI provider implementation.
 * Uses the provided API key (AI_API_KEY) and model (AI_MODEL=gpt-4o-mini).
 *
 * Security: API key is server-side only; never exposed to the browser.
 * Budget: AI_DAILY_BUDGET controls max calls per day.
 */
@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly model: string;
  readonly isEnabled: boolean;

  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';
  private dailyCallCount = 0;
  private dailyBudget: number;
  private lastResetDate: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY ?? '';
    this.model = process.env.AI_MODEL ?? 'gpt-4o-mini';
    this.isEnabled = !!this.apiKey;
    this.dailyBudget = parseInt(process.env.AI_DAILY_BUDGET ?? '100');
    this.lastResetDate = new Date().toDateString();

    if (!this.isEnabled) {
      this.logger.warn('OpenAI provider disabled — AI_API_KEY not set');
    } else {
      this.logger.log(`OpenAI provider enabled: model=${this.model}, budget=${this.dailyBudget}/day`);
    }
  }

  private resetDailyCountIfNeeded() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyCallCount = 0;
      this.lastResetDate = today;
    }
  }

  async chat(
    messages: AIMessage[],
    options: { maxTokens?: number; temperature?: number; jsonMode?: boolean } = {},
  ): Promise<AIResponse> {
    if (!this.isEnabled) {
      throw new Error('AI provider not configured — set AI_API_KEY');
    }

    this.resetDailyCountIfNeeded();
    if (this.dailyCallCount >= this.dailyBudget) {
      throw new Error(`AI daily budget (${this.dailyBudget}) exceeded`);
    }

    const body: any = {
      model: this.model,
      messages,
      max_tokens: options.maxTokens ?? 1500,
      temperature: options.temperature ?? 0.2,
    };

    if (options.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const response = await axios.post(`${this.baseUrl}/chat/completions`, body, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });

    this.dailyCallCount++;
    const choice = response.data.choices[0];
    return {
      content: choice.message.content,
      model: response.data.model,
      promptTokens: response.data.usage.prompt_tokens,
      completionTokens: response.data.usage.completion_tokens,
      finishReason: choice.finish_reason,
    };
  }

  async ping(): Promise<boolean> {
    if (!this.isEnabled) return false;
    try {
      await axios.get(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 5_000,
      });
      return true;
    } catch {
      return false;
    }
  }
}
