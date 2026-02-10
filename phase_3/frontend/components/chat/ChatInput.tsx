"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { CHAT_CONSTRAINTS } from "@/types/chat";

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  const trimmed = text.trim();
  const charCount = trimmed.length;
  const isOverLimit = charCount > CHAT_CONSTRAINTS.MESSAGE_MAX_LENGTH;
  const canSend = charCount >= CHAT_CONSTRAINTS.MESSAGE_MIN_LENGTH && !isOverLimit && !isLoading && !disabled;
  const showCounter = charCount > CHAT_CONSTRAINTS.MESSAGE_MAX_LENGTH * 0.8;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(trimmed);
    setText("");
  }, [canSend, trimmed, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="border-t border-slate-800 bg-slate-900 p-4">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            disabled={isLoading || disabled}
            rows={1}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-800/50 disabled:text-slate-500"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          {showCounter && (
            <span
              className={`absolute bottom-1 right-2 text-xs ${
                isOverLimit ? "text-red-400 font-medium" : "text-slate-500"
              }`}
            >
              {charCount}/{CHAT_CONSTRAINTS.MESSAGE_MAX_LENGTH}
            </span>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
