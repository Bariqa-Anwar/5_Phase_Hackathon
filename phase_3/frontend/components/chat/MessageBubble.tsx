"use client";

import { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/cn";
import { AlertCircle, Loader2 } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

const toolCallColors: Record<string, string> = {
  task_created: "bg-emerald-500/10 text-emerald-400",
  tasks_listed: "bg-sky-500/10 text-sky-400",
  task_completed: "bg-yellow-500/10 text-yellow-400",
  task_deleted: "bg-red-500/10 text-red-400",
  task_updated: "bg-purple-500/10 text-purple-400",
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const isSending = message.status === "sending";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2.5",
          isUser
            ? isError
              ? "bg-red-500/10 text-red-300"
              : "bg-emerald-600 text-white"
            : "bg-slate-800 text-slate-100"
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>

        {/* Tool call chips */}
        {!isUser && message.toolCalls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.toolCalls.map((tc, i) => (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  toolCallColors[tc.action] || "bg-slate-700 text-slate-300"
                )}
              >
                {tc.label}
              </span>
            ))}
          </div>
        )}

        {/* Status indicators */}
        <div className="mt-1 flex items-center gap-1">
          {isSending && (
            <Loader2 className="h-3 w-3 animate-spin text-emerald-300" />
          )}
          {isError && isUser && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              Failed to send
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
