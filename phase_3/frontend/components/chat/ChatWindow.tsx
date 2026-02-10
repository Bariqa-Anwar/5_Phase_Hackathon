"use client";

import { useEffect, useRef } from "react";
import { MessageCircle, Plus, X, Loader2 } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onReset: () => void;
  onDismissError: () => void;
  disabled?: boolean;
}

export default function ChatWindow({
  messages,
  isLoading,
  error,
  onSend,
  onReset,
  onDismissError,
  disabled,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-800 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-50">Chat</h2>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between border-b border-red-500/20 bg-red-500/10 px-4 py-2.5">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={onDismissError}
            className="rounded p-1 text-red-400 hover:bg-red-500/10"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <MessageCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-100">
              AI Task Assistant
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-400">
              I can help you manage your tasks. Try saying:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>&ldquo;Add a task to buy groceries&rdquo;</li>
              <li>&ldquo;Show me my tasks&rdquo;</li>
              <li>&ldquo;Mark the first task as completed&rdquo;</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {/* Loading indicator for pending assistant response */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} isLoading={isLoading} disabled={disabled} />
    </div>
  );
}
