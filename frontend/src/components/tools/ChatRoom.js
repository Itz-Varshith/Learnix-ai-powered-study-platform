"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  Sparkles,
  Bot,
} from "lucide-react";
import { io } from "socket.io-client";
import { auth } from "@/lib/firebase";

const API_BASE = "http://localhost:9000";
const SOCKET_URL = "http://localhost:9000";

// AI mention pattern
const AI_MENTION_PATTERN = /@learnix/i;

/**
 * ChatRoom Component
 * Real-time chat for courses and study groups
 * Uses REST API for history + Socket.IO for live updates
 * Supports @learnix AI mentions (memory is persisted in database)
 */
export default function ChatRoom({ courseId, groupId }) {
  // Use courseId or groupId (both point to same Course model)
  const roomId = courseId || groupId;

  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [aiTyping, setAiTyping] = useState(false);

  // Refs
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get current user
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  // Fetch chat history via REST API
  const fetchChatHistory = useCallback(async () => {
    if (!roomId) return;

    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to view chat");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/chat/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.data || []);
      } else {
        setError(data.message || "Failed to load chat history");
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setError("Failed to load chat. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const user = auth.currentUser;
    if (!user) return;

    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Socket connected");

      // Authenticate
      socket.emit("authenticate", {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
      });
    });

    socket.on("authenticated", () => {
      console.log("Socket authenticated");

      // Join the room
      socket.emit("join-room", { courseId: roomId });
    });

    socket.on("joined-room", (data) => {
      console.log("Joined room:", data.roomId);
      setConnected(true);
    });

    // New message handler
    socket.on("new-message", (message) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    // Error handler
    socket.on("error", (err) => {
      console.error("Socket error:", err.message);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    // Fetch initial history
    fetchChatHistory();

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, currentUserId, fetchChatHistory]);

  // Send message to AI endpoint (memory is handled by backend)
  const sendToAI = async (messageContent) => {
    try {
      setAiTyping(true);
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const token = await user.getIdToken();

      const response = await fetch(
        `${API_BASE}/api/courses/reply-tagged-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageString: messageContent,
            courseId: roomId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Add both messages to state (they're saved to DB by backend)
        if (data.data?.userMessage) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.data.userMessage.id)) {
              return prev;
            }
            return [...prev, data.data.userMessage];
          });
        }
        if (data.data?.aiMessage) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.data.aiMessage.id)) {
              return prev;
            }
            return [...prev, data.data.aiMessage];
          });
        }
      } else {
        setError(data.message || "Failed to get AI response");
      }
    } catch (err) {
      console.error("Error sending to AI:", err);
      setError("Failed to get AI response. Please try again.");
    } finally {
      setAiTyping(false);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || sending) return;

    // Check if message mentions @learnix
    const isAIMention = AI_MENTION_PATTERN.test(trimmedInput);

    if (isAIMention) {
      // Send to AI endpoint (will save both user and AI messages)
      setSending(true);
      setInput("");
      await sendToAI(trimmedInput);
      setSending(false);
      inputRef.current?.focus();
      return;
    }

    // Regular message - send via WebSocket
    if (!socketRef.current || !connected) {
      setError("Not connected to chat. Please refresh.");
      return;
    }

    try {
      setSending(true);

      // Emit via Socket.IO (server will save to DB and broadcast)
      socketRef.current.emit("send-message", {
        content: trimmedInput,
        courseId: roomId,
      });

      setInput("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Check if message is from current user
  const isSelf = (senderId) => senderId === currentUserId;

  // Check if message is from AI (Bot_Account is the senderId used by backend)
  const isAI = (senderId) => senderId === "Bot_Account";

  // Highlight @learnix mentions in message
  const renderMessageContent = (content, isAiMessage) => {
    if (isAiMessage) {
      return content;
    }

    // Highlight @learnix mentions
    const parts = content.split(/(@learnix)/gi);
    return parts.map((part, index) => {
      if (part.toLowerCase() === "@learnix") {
        return (
          <span
            key={index}
            className="bg-violet-500/30 text-violet-200 px-1 py-0.5 rounded font-semibold"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border border-slate-800 shadow-xl animate-in fade-in duration-500 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <span className="ml-3 text-slate-400">Loading chat...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border border-slate-800 shadow-xl animate-in fade-in duration-500 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-slate-300 font-medium mb-2">{error}</p>
          <button
            onClick={fetchChatHistory}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border border-slate-800 shadow-xl animate-in fade-in duration-500 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-100 flex items-center gap-2">
            Group Chat
            <span className="text-xs text-slate-500 font-normal">
              Type <span className="text-violet-400 font-medium">@learnix</span>{" "}
              to ask AI
            </span>
          </h2>
          <p className="text-xs text-slate-500">{messages.length} messages</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Wifi size={12} />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              <WifiOff size={12} />
              Connecting...
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-900/50 to-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <Bot className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-lg font-medium mb-1 text-slate-400">
              No messages yet
            </p>
            <p className="text-sm">
              Start a conversation or type{" "}
              <span className="text-violet-400 font-medium">@learnix</span> to
              ask AI!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const self = isSelf(msg.senderId);
            const ai = isAI(msg.senderId);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  self ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[85%] ${
                    self ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  {!self && (
                    <div
                      className={`w-8 h-8 mb-1 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        ai
                          ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {ai ? (
                        <Sparkles size={14} />
                      ) : (
                        msg.senderName?.charAt(0)?.toUpperCase() || "?"
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-sm shadow-lg ${
                      self
                        ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm"
                        : ai
                        ? "bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-slate-100 rounded-tl-sm border border-violet-500/30 backdrop-blur-sm"
                        : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
                    }`}
                  >
                    {/* Sender name */}
                    {!self && (
                      <span
                        className={`block text-[10px] font-bold mb-1 ${
                          ai ? "text-violet-400" : "text-slate-500"
                        }`}
                      >
                        {ai && <Sparkles className="inline w-3 h-3 mr-1" />}
                        {msg.senderName}
                      </span>
                    )}
                    <div className="whitespace-pre-wrap break-words">
                      {renderMessageContent(msg.content, ai)}
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-slate-600 mt-1 px-2">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}

        {/* AI Typing Indicator */}
        {aiTyping && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 rounded-2xl rounded-tl-sm p-4 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800">
        {error && (
          <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-300 hover:text-red-100"
            >
              ×
            </button>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              placeholder={
                connected
                  ? "Type a message... (use @learnix to ask AI)"
                  : "Connecting..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!connected || sending || aiTyping}
              maxLength={2000}
            />
            {input.toLowerCase().includes("@learnix") && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full border border-violet-500/30 flex items-center gap-1">
                  <Sparkles size={10} />
                  AI Mode
                </span>
              </div>
            )}
          </div>
          <button
            type="submit"
            className={`p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              input.toLowerCase().includes("@learnix")
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30"
                : "bg-indigo-600 hover:bg-indigo-500"
            } text-white`}
            disabled={!input.trim() || !connected || sending || aiTyping}
          >
            {sending || aiTyping ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
