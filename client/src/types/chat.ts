import React from 'react';
export type AgentType =
  | 'web_search'
  | 'web_browsing'
  | 'code_exec_python'
  | 'code_exec_javascript'
  | 'code_exec_ruby'
  | 'code_exec_go';

export type Agent = {
  id: AgentType;
  name: string;
  icon: React.ElementType;
};

export type ModelType = 'claude-3-7-sonnet' | 'claude-3-5-sonnet-latest';
export type MessageRole = 'user' | 'assistant' | 'agent';

export interface Message {
  role: MessageRole;
  content: string;
  reasoning?: {
    thinking: string;
  };
  tool_calls?: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
  is_tool_message?: boolean;
}

export interface ChatError {
  message: string;
  code?: string;
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint: string;
  choices: {
    delta: {
      content: string | null;
      tool_calls:
        | {
            id: string;
            type: string;
            function: {
              name: string;
              arguments: string;
            };
          }[]
        | null;
      role: string;
      reasoning?: {
        thinking: string;
      };
    };
    message: {
      content: string;
      tool_calls:
        | {
            id: string;
            type: string;
            function: {
              name: string;
              arguments: string;
            };
          }[]
        | null;
      role: string;
      reasoning?: {
        thinking: string;
      };
    };
    finish_reason: string;
    index: number;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface UseCustomChatProps {
  model: ModelType;
  reasoning: boolean;
  agents: AgentType[];
  historyLimit?: number;
}
