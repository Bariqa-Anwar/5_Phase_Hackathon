"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { ChatMessage, CHAT_CONSTRAINTS } from "@/types/chat";
import { parseToolCalls } from "@/lib/chat-utils";

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: number | null;
  sendMessage: (text: string) => Promise<void>;
  resetChat: () => void;
  dismissError: () => void;
}

export function useChat(userId: string | undefined): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (trimmed.length > CHAT_CONSTRAINTS.MESSAGE_MAX_LENGTH) return;
      if (!userId) {
        setError("You must be logged in to send messages.");
        return;
      }

      // Add optimistic user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        toolCalls: [],
        timestamp: new Date(),
        status: "sending",
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.chat.sendMessage(
          userId,
          trimmed,
          conversationId ?? undefined
        );

        // Update user message status to sent
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsg.id ? { ...m, status: "sent" as const } : m
          )
        );

        // Store conversation ID from backend
        setConversationId(response.conversation_id);

        // Add assistant message with parsed tool-call indicators
        const assistantMsg: ChatMessage = {
          id: `assistant-${response.message_id}`,
          role: "assistant",
          content: response.response,
          toolCalls: parseToolCalls(response.response),
          timestamp: new Date(),
          status: "sent",
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send message";

        // Handle 404 conversation not found — reset conversation
        if (message.includes("Conversation not found")) {
          setConversationId(null);
          setError("Conversation not found. Starting a new chat.");
        } else {
          setError(message);
        }

        // Mark user message as error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsg.id ? { ...m, status: "error" as const } : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [userId, conversationId]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    resetChat,
    dismissError,
  };
}
