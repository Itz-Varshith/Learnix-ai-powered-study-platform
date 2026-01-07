"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { io } from "socket.io-client";
import { auth } from "@/lib/firebase";

const API_BASE = "http://localhost:9000";
const SOCKET_URL = "http://localhost:9000";

/**
 * ChatRoom Component
 * Real-time chat for courses and study groups
 * Uses REST API for history + Socket.IO for live updates
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
      setMessages((prev) => [...prev, message]);
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

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || sending) return;

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

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border shadow-sm animate-in fade-in duration-500 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading chat...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border shadow-sm animate-in fade-in duration-500 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-gray-700 font-medium mb-2">{error}</p>
          <button
            onClick={fetchChatHistory}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border shadow-sm animate-in fade-in duration-500 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">Group Chat</h2>
          <p className="text-xs text-gray-500">{messages.length} messages</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <Wifi size={12} />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              <WifiOff size={12} />
              Connecting...
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <p className="text-lg font-medium mb-1">No messages yet</p>
            <p className="text-sm">Be the first to send a message!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const self = isSelf(msg.senderId);
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
                  {/* Avatar for others */}
                  {!self && (
                    <div className="w-8 h-8 mb-1 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-200 shrink-0">
                      {msg.senderName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-sm shadow-sm ${
                      self
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
                    }`}
                  >
                    {/* Sender name for others */}
                    {!self && (
                      <span className="block text-[10px] font-bold text-gray-500 mb-1">
                        {msg.senderName}
                      </span>
                    )}
                    {msg.content}
                  </div>
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-gray-400 mt-1 px-2">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-50 border-t">
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={connected ? "Type a message..." : "Connecting..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!connected || sending}
            maxLength={2000}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!input.trim() || !connected || sending}
          >
            {sending ? (
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
