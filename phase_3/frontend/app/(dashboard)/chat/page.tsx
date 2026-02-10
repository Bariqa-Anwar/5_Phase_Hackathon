"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useChat } from "@/lib/hooks/useChat";
import ChatWindow from "@/components/chat/ChatWindow";
import Spinner from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { messages, isLoading, error, sendMessage, resetChat, dismissError } =
    useChat(user?.id);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto h-full max-w-4xl">
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSend={sendMessage}
        onReset={resetChat}
        onDismissError={dismissError}
        disabled={!user?.id}
      />
    </div>
  );
}
