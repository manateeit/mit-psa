// src/interfaces/ChatModelInterface.ts

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TokenResponse {
  text?: string;
  special?: boolean;
  context?: string;
}

export interface StreamResponse {
  token?: TokenResponse;
  error?: boolean;
  message?: string;
}

export interface ChatResponse {
  text: string;
  error?: boolean;
  message?: string;
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface FunctionCallResult {
  result: any;
}

export interface ChatModelInterface {
  sendMessage(
    messages: ChatMessage[],
    options?: {
      selectedAccount?: string;
      userId?: string;
      auth_token?: string;
      chatId?: string;
      messageCount?: number;
    }
  ): Promise<ChatResponse>;

  streamMessage(
    messages: ChatMessage[],
    onTokenReceived: (token: string) => void,
    options?: {
      selectedAccount?: string;
      userId?: string;
      auth_token?: string;
      chatId?: string;
      messageCount?: number;
      abortController?: AbortController;
    }
  ): Promise<void>;

  // Optional: Support for function calling
  defineFunctions?(functions: FunctionDefinition[]): void;
  callFunction?(
    functionName: string,
    args: any
  ): Promise<FunctionCallResult>;
}
