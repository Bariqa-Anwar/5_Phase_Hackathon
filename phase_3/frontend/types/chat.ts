/**
 * Chat-related type definitions
 * Aligned with backend ChatRequest/ChatResponse from Feature 004
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls: ToolCallAction[];
  timestamp: Date;
  status: "sending" | "sent" | "error";
}

export interface ChatResponse {
  response: string;
  conversation_id: number;
  message_id: number;
}

export interface ChatRequest {
  message: string;
  conversation_id?: number;
}

export interface ToolCallAction {
  action: string;
  label: string;
}

export const CHAT_CONSTRAINTS = {
  MESSAGE_MAX_LENGTH: 10000,
  MESSAGE_MIN_LENGTH: 1,
} as const;
