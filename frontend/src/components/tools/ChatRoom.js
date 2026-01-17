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
  Code2,
} from "lucide-react";
import { io } from "socket.io-client";
import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

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
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

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

  // Markdown renderer for AI messages
  const renderMarkdown = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLang = '';
    let listItems = [];
    let listType = null;

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${elements.length}`} className={`my-2 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside space-y-1 text-gray-700`}>
            {listItems.map((item, i) => (
              <li key={i} className="leading-relaxed">{renderInline(item)}</li>
            ))}
          </ListTag>
        );
        listItems = [];
        listType = null;
      }
    };

    const renderInline = (text) => {
      const parts = [];
      let remaining = text;
      let key = 0;

      while (remaining.length > 0) {
        // Math notation $...$
        const mathMatch = remaining.match(/^\$([^$]+)\$/);
        if (mathMatch) {
          parts.push(
            <span key={key++} className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
              {mathMatch[1]}
            </span>
          );
          remaining = remaining.slice(mathMatch[0].length);
          continue;
        }

        // Bold **...**
        const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
        if (boldMatch) {
          parts.push(<strong key={key++} className="font-semibold text-gray-900">{boldMatch[1]}</strong>);
          remaining = remaining.slice(boldMatch[0].length);
          continue;
        }

        // Italic *...*
        const italicMatch = remaining.match(/^\*([^*]+)\*/);
        if (italicMatch) {
          parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
          remaining = remaining.slice(italicMatch[0].length);
          continue;
        }

        // Inline code `...`
        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
          parts.push(
            <code key={key++} className="px-1.5 py-0.5 bg-gray-100 text-indigo-600 rounded text-[13px] font-mono">
              {codeMatch[1]}
            </code>
          );
          remaining = remaining.slice(codeMatch[0].length);
          continue;
        }

        // @learnix mention
        const mentionMatch = remaining.match(/^@learnix/i);
        if (mentionMatch) {
          parts.push(
            <span key={key++} className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
              {mentionMatch[0]}
            </span>
          );
          remaining = remaining.slice(mentionMatch[0].length);
          continue;
        }

        // Find next special char
        const nextSpecial = remaining.search(/[\$\*`@]/);
        if (nextSpecial === -1) {
          parts.push(remaining);
          break;
        } else if (nextSpecial === 0) {
          parts.push(remaining[0]);
          remaining = remaining.slice(1);
        } else {
          parts.push(remaining.slice(0, nextSpecial));
          remaining = remaining.slice(nextSpecial);
        }
      }

      return parts;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start/end
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushList();
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
          codeBlockContent = [];
        } else {
          elements.push(
            <div key={`code-${elements.length}`} className="my-3 rounded-lg overflow-hidden bg-gray-900 border border-gray-300">
              {codeBlockLang && (
                <div className="px-3 py-1.5 bg-gray-800 text-xs text-gray-300 font-mono flex items-center gap-1.5 border-b border-gray-700">
                  <Code2 size={11} />
                  {codeBlockLang}
                </div>
              )}
              <pre className="p-3 overflow-x-auto">
                <code className="text-green-400 font-mono text-sm leading-relaxed">
                  {codeBlockContent.join('\n')}
                </code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeBlockLang = '';
          codeBlockContent = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Headers
      const h4Match = line.match(/^####\s+(.+)$/);
      if (h4Match) {
        flushList();
        elements.push(
          <h4 key={`h4-${elements.length}`} className="text-sm font-semibold text-gray-900 mt-3 mb-1.5">
            {renderInline(h4Match[1])}
          </h4>
        );
        continue;
      }

      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        flushList();
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-base font-semibold text-gray-900 mt-4 mb-2">
            {renderInline(h3Match[1])}
          </h3>
        );
        continue;
      }

      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        flushList();
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-lg font-bold text-gray-900 mt-4 mb-2">
            {renderInline(h2Match[1])}
          </h2>
        );
        continue;
      }

      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        flushList();
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-xl font-bold text-gray-900 mt-4 mb-2">
            {renderInline(h1Match[1])}
          </h1>
        );
        continue;
      }

      // Horizontal rule
      if (line.match(/^(\*\*\*|---|___)$/)) {
        flushList();
        elements.push(<hr key={`hr-${elements.length}`} className="my-3 border-gray-300" />);
        continue;
      }

      // Ordered list
      const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (olMatch) {
        if (listType !== 'ol') flushList();
        listType = 'ol';
        listItems.push(olMatch[2]);
        continue;
      }

      // Unordered list
      const ulMatch = line.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        if (listType !== 'ul') flushList();
        listType = 'ul';
        listItems.push(ulMatch[1]);
        continue;
      }

      // Letter list (A. B. C.)
      const letterMatch = line.match(/^([A-Z])\.\s+(.+)$/);
      if (letterMatch) {
        flushList();
        elements.push(
          <div key={`letter-${elements.length}`} className="my-1.5">
            <span className="font-semibold text-indigo-600">{letterMatch[1]}. </span>
            <span className="text-gray-700">{renderInline(letterMatch[2])}</span>
          </div>
        );
        continue;
      }

      // Table row (simple)
      if (line.startsWith('|') && line.endsWith('|')) {
        flushList();
        const cells = line.slice(1, -1).split('|').map(c => c.trim());
        // Skip separator rows
        if (cells.every(c => c.match(/^:?-+:?$/))) continue;
        elements.push(
          <div key={`table-${elements.length}`} className="flex gap-4 my-1 text-sm">
            {cells.map((cell, ci) => (
              <span key={ci} className={ci === 0 ? "font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded" : "text-gray-700"}>
                {renderInline(cell)}
              </span>
            ))}
          </div>
        );
        continue;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${elements.length}`} className="my-1.5 leading-relaxed text-gray-700">
          {renderInline(line)}
        </p>
      );
    }

    flushList();
    return elements.length > 0 ? elements : <span>{content}</span>;
  };

  // Render user message with @learnix highlighting
  const renderUserMessage = (content) => {
    const parts = content.split(/(@learnix)/gi);
    return parts.map((part, index) => {
      if (part.toLowerCase() === "@learnix") {
        return (
          <span
            key={index}
            className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold"
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
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in duration-500 overflow-hidden">
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
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in duration-500 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
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
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in duration-500 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            Group Chat
            <span className="text-xs text-gray-500 font-normal">
              Type <span className="text-indigo-600 font-medium">@learnix</span>{" "}
              to ask AI
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{messages.length} messages</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <Wifi size={12} />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
              <WifiOff size={12} />
              Connecting...
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-1.5 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bot className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium mb-1 text-gray-600">
              No messages yet
            </p>
            <p className="text-sm">
              Start a conversation or type{" "}
              <span className="text-indigo-600 font-medium">@learnix</span> to
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
                className={`flex flex-col group ${
                  self ? "items-end" : "items-start"
                }`}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                <div
                  className={`flex items-end gap-2 max-w-[85%] ${
                    self ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  {!self && (
                    <div
                      className={`w-7 h-7 mb-0.5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        ai
                          ? "bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md"
                          : "bg-gray-200 text-gray-700 border border-gray-300"
                      }`}
                    >
                      {ai ? (
                        <Sparkles size={13} />
                      ) : (
                        msg.senderName?.charAt(0)?.toUpperCase() || "?"
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm shadow-sm transition-all ${
                      self
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : ai
                        ? "bg-indigo-50 text-gray-800 rounded-tl-sm border border-indigo-200 max-w-full"
                        : "bg-white text-gray-800 rounded-tl-sm border border-gray-200"
                    }`}
                  >
                    {/* Sender name */}
                    {!self && (
                      <span
                        className={`block text-[10px] font-bold mb-1 ${
                          ai ? "text-indigo-600" : "text-gray-500"
                        }`}
                      >
                        {ai && <Sparkles className="inline w-3 h-3 mr-0.5" />}
                        {msg.senderName}
                      </span>
                    )}
                    <div className="break-words">
                      {ai ? renderMarkdown(msg.content) : renderUserMessage(msg.content)}
                    </div>
                  </div>
                </div>

                {/* Timestamp - only visible on hover */}
                <span 
                  className={`text-[10px] text-gray-400 px-2 transition-opacity duration-200 ${
                    hoveredMessageId === msg.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}

        {/* AI Typing Indicator */}
        {aiTyping && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md">
              <Sparkles size={13} className="text-white" />
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* Input Area */}
      <div className="p-3.5 bg-white border-t border-gray-200 shrink-0">
        {error && (
          <div className="mb-2.5 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              placeholder={
                connected
                  ? "Type a message... (use @learnix to ask AI)"
                  : "Connecting..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              disabled={!connected || sending || aiTyping}
              maxLength={2000}
            />
            {input.toLowerCase().includes("@learnix") && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-200 flex items-center gap-1">
                  <Sparkles size={10} />
                  AI Mode
                </span>
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            className={`px-3 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              input.toLowerCase().includes("@learnix")
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-md"
                : "bg-indigo-600 hover:bg-indigo-700"
            } text-white`}
            disabled={!input.trim() || !connected || sending || aiTyping}
          >
            {sending || aiTyping ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}