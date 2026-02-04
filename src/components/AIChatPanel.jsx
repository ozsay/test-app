import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";

const AGENT_NAME = "task_manager";

export function AIChatPanel({ onTasksChanged }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [authError, setAuthError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check authentication and load/create conversation when panel opens
  useEffect(() => {
    if (!isOpen) return;

    let unsubscribe = null;
    let isMounted = true;

    const initConversation = async () => {
      setIsLoading(true);
      setAuthError(null);

      try {
        // First check if user is authenticated
        let user = null;
        try {
          user = await base44.auth.me();
        } catch (authErr) {
          // auth.me() throws when not logged in
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;

        if (!user) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Create a new conversation for this session
        const conv = await base44.agents.createConversation({
          agent_name: AGENT_NAME,
        });

        if (!isMounted) return;

        setConversation(conv);
        setMessages(conv.messages || []);

        // Subscribe to real-time updates
        unsubscribe = base44.agents.subscribeToConversation(
          conv.id,
          (updated) => {
            if (isMounted) {
              setMessages(updated.messages || []);
              // Notify parent that tasks may have changed
              if (onTasksChanged) {
                onTasksChanged();
              }
            }
          }
        );
      } catch (error) {
        console.error("Error initializing conversation:", error);
        if (isMounted) {
          // Check if it's an auth error
          if (error.message?.includes("authenticated") || error.status === 401) {
            setIsAuthenticated(false);
          } else {
            setAuthError("Failed to start conversation. Please try again.");
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initConversation();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isOpen, onTasksChanged]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !conversation || isSending) return;

    const messageContent = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: messageContent,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setInputValue(messageContent); // Restore input on error
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = async () => {
    setIsLoading(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
      });
      setConversation(conv);
      setMessages([]);
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out hidden messages and get visible ones
  const visibleMessages = messages.filter((m) => !m.hidden);

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-medium">Task Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={startNewConversation}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-xs"
                title="New conversation"
              >
                New
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
            ) : isAuthenticated === false || authError ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-4">
                <User className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-600 mb-2">
                  Login Required
                </p>
                <p className="text-sm">
                  {authError || "Please log in to use the AI task assistant."}
                </p>
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-4">
                <Bot className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-sm">
                  Hi! I'm your task assistant. I can help you create, update,
                  complete, or delete tasks. Just tell me what you need!
                </p>
              </div>
            ) : (
              visibleMessages.map((message, index) => (
                <MessageBubble key={message.id || index} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-slate-100"
          >
            <div className="flex gap-2">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAuthenticated === false ? "Login required..." : "Ask me to manage your tasks..."}
                className="flex-1 h-10 bg-slate-50 border-slate-200 rounded-xl text-sm"
                disabled={isLoading || isSending || !conversation || isAuthenticated === false}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading || isSending || !conversation || isAuthenticated === false}
                className="h-10 w-10 rounded-xl bg-orange-500 hover:bg-orange-600 p-0"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Check if assistant is still thinking (no content yet but message exists)
  const isThinking = isAssistant && !message.content && !message.tool_calls;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-orange-500 text-white rounded-br-md"
            : "bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm"
        }`}
      >
        {isThinking ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : (
          <>
            {/* Tool calls indicator */}
            {message.tool_calls && message.tool_calls.length > 0 && (
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                {message.tool_calls.map((tc) => tc.name).join(", ")}
              </div>
            )}
            {/* Message content */}
            <p className="text-sm whitespace-pre-wrap">
              {typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
