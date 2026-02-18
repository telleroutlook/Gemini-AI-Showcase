import React from 'react';

export interface ModelInfo {
  id: string;
  name: string;
  badge: string;
  description: string;
  capabilities: string[];
  bestFor: string;
  icon: React.ReactNode;
  version: '3.0' | '2.5' | 'Specialized';
}

export interface Attachment {
  type: 'image' | 'audio' | 'file';
  mimeType: string;
  data: string; // Base64 string
  name?: string;
}

export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  attachments?: Attachment[];
  timestamp: number;
  // Grounding metadata for search results
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
  };
  // Smart reply suggestions
  suggestions?: string[];
  // Token usage statistics
  usageMetadata?: UsageMetadata;
  // Performance timing
  timing?: {
    startTime: number;
    endTime?: number;
    duration?: number;
  };
}

export interface SessionConfig {
  systemInstruction?: string;
  temperature?: number; // 0.0 to 2.0
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number; // New for Gemini 3.0/2.5
  useSearch?: boolean; // Google Search Grounding
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string; // Track which model was used
  config?: SessionConfig; // Per-session configuration
  createdAt: number;
  updatedAt: number;
}