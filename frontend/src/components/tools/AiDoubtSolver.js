"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Loader2,
  Bot,
  User,
  Trash2,
  Menu,
  X,
  Clock,
  ChevronRight,
  Zap,
  BookOpen,
  Brain,
  Search,
  Copy,
  Check,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  Code2,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import { auth } from "@/lib/firebase";

const API_BASE = "http://localhost:9000";

/**
 * AiDoubtSolver Component
 * Personal AI chat assistant for academic help
 * Features: multiple chat sessions, persistent history, markdown rendering, modern UI
 */
export default function AiDoubtSolver() {
  // Chat list state
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [loadingChats, setLoadingChats] = useState(true);

  // Current chat messages state
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Input and sending state
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  // UI state
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewChatInput, setShowNewChatInput] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState(null);

  // Refs
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const newChatInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!showScrollButton) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollButton]);

  // Focus new chat input when shown
  useEffect(() => {
    if (showNewChatInput) {
      newChatInputRef.current?.focus();
    }
  }, [showNewChatInput]);

  // Handle scroll position for scroll button
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  // Scroll to bottom function
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  // Copy message to clipboard
  const copyMessage = async (messageId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Fetch all chats on mount
  const fetchChats = useCallback(async () => {
    try {
      setLoadingChats(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to use AI Chat");
        setLoadingChats(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/courses/get-ai-chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setChats(data.data || []);
        // Auto-select first chat if exists
        if (data.data?.length > 0 && !selectedChatId) {
          setSelectedChatId(data.data[0].id);
        }
      } else {
        setError(data.message || "Failed to load chats");
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load chats. Please try again.");
    } finally {
      setLoadingChats(false);
    }
  }, [selectedChatId]);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) return;

    try {
      setLoadingMessages(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(
        `${API_BASE}/api/courses/fetch-ai-chat-messages/${chatId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessages(data.data || []);
      } else {
        setError(data.message || "Failed to load messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    } else {
      setMessages([]);
    }
  }, [selectedChatId, fetchMessages]);

  // Create new chat
  const createChat = async (e) => {
    e?.preventDefault();
    const chatName = newChatName.trim() || `Chat ${new Date().toLocaleDateString()}`;

    try {
      setCreatingChat(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to create a chat");
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/courses/create-ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatName }),
      });

      const data = await response.json();

      if (data.success) {
        setChats((prev) => [data.data, ...prev]);
        setSelectedChatId(data.data.id);
        setNewChatName("");
        setShowNewChatInput(false);
        setMessages([]);
      } else {
        setError(data.message || "Failed to create chat");
      }
    } catch (err) {
      console.error("Error creating chat:", err);
      setError("Failed to create chat. Please try again.");
    } finally {
      setCreatingChat(false);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || sending || !selectedChatId) return;

    // Optimistically add user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      message: trimmedInput,
      isSentByUser: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    setSending(true);
    setShowScrollButton(false);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to send messages");
        setSending(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(
        `${API_BASE}/api/courses/send-ai-chat-message/${selectedChatId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: trimmedInput }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Replace temp message with real ones
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [
            ...filtered,
            data.data.userMessage,
            data.data.aiMessage,
          ];
        });

        // Update chat in list (move to top)
        setChats((prev) => {
          const updated = prev.map((chat) =>
            chat.id === selectedChatId
              ? { ...chat, updatedAt: new Date().toISOString() }
              : chat
          );
          return updated.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
        });
      } else {
        setError(data.message || "Failed to send message");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Format message time
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render message content with basic formatting
  const renderMessageContent = (content) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Code block
        const codeContent = part.slice(3, -3);
        const firstLine = codeContent.split("\n")[0];
        const hasLanguage = firstLine && !firstLine.includes(" ") && firstLine.length < 20;
        const language = hasLanguage ? firstLine : "";
        const code = hasLanguage ? codeContent.slice(firstLine.length + 1) : codeContent;
        
        return (
          <div key={index} className="my-3 rounded-lg overflow-hidden bg-slate-950 border border-slate-700">
            {language && (
              <div className="px-3 py-1.5 bg-slate-800 text-xs text-slate-400 font-mono flex items-center gap-2">
                <Code2 size={12} />
                {language}
              </div>
            )}
            <pre className="p-3 overflow-x-auto text-sm">
              <code className="text-emerald-400 font-mono">{code.trim()}</code>
            </pre>
          </div>
        );
      }
      
      // Regular text - handle inline formatting
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((segment, i) => {
            if (segment.startsWith("**") && segment.endsWith("**")) {
              return <strong key={i} className="font-bold">{segment.slice(2, -2)}</strong>;
            }
            if (segment.startsWith("*") && segment.endsWith("*") && !segment.startsWith("**")) {
              return <em key={i} className="italic">{segment.slice(1, -1)}</em>;
            }
            if (segment.startsWith("`") && segment.endsWith("`")) {
              return (
                <code key={i} className="px-1.5 py-0.5 bg-slate-700 rounded text-amber-400 font-mono text-[0.85em]">
                  {segment.slice(1, -1)}
                </code>
              );
            }
            return segment;
          })}
        </span>
      );
    });
  };

  // Filter chats by search query
  const filteredChats = chats.filter((chat) =>
    chat.chatName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selected chat data
  const selectedChat = chats.find((c) => c.id === selectedChatId);

  // Loading state for entire component
  if (loadingChats && chats.length === 0) {
    return (
      <div className="flex h-[calc(100vh-140px)] bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4 relative" />
            </div>
            <p className="text-slate-400 font-medium">Loading your chats...</p>
            <p className="text-slate-600 text-sm mt-1">Preparing your AI assistant</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Sidebar - Chat List */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 ease-out bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-indigo-600/20 to-violet-600/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg block">AI Chats</span>
                <span className="text-xs text-slate-400">{chats.length} conversations</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/50 rounded-lg border border-slate-700 placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {/* New Chat Button / Input */}
          {showNewChatInput ? (
            <form onSubmit={createChat} className="flex gap-2">
              <input
                ref={newChatInputRef}
                type="text"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder="Chat name..."
                className="flex-1 px-3 py-2.5 text-sm bg-slate-800 rounded-lg border border-slate-700 placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                disabled={creatingChat}
              />
              <button
                type="submit"
                disabled={creatingChat}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/25"
              >
                {creatingChat ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewChatInput(false);
                  setNewChatName("");
                }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowNewChatInput(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="p-6 text-center">
              <div className="p-4 bg-slate-800/50 rounded-2xl inline-block mb-3">
                <MessageSquare className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">
                {searchQuery ? "No chats found" : "No chats yet"}
              </p>
              <p className="text-slate-600 text-xs">
                {searchQuery ? "Try a different search" : "Create a new chat to get started"}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="group relative"
                >
                  <button
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`w-full text-left px-4 py-3.5 transition-all ${
                      selectedChatId === chat.id
                        ? "bg-indigo-500/20 border-l-2 border-indigo-500"
                        : "border-l-2 border-transparent hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          selectedChatId === chat.id
                            ? "bg-indigo-500/30 text-indigo-400"
                            : "bg-slate-800 text-slate-500 group-hover:text-slate-400"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-sm truncate transition-colors ${
                            selectedChatId === chat.id
                              ? "text-indigo-200"
                              : "text-slate-300 group-hover:text-slate-200"
                          }`}
                        >
                          {chat.chatName}
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTime(chat.updatedAt || chat.createdAt)}
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 transition-all ${
                          selectedChatId === chat.id
                            ? "text-indigo-400 translate-x-0.5"
                            : "text-slate-700 group-hover:text-slate-500"
                        }`}
                      />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Powered by AI</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-slate-900/50 to-transparent">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
          )}
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-100 truncate flex items-center gap-2">
              {selectedChat?.chatName || "AI Doubt Solver"}
              {selectedChat && (
                <span className="text-xs font-normal text-slate-500">
                  • {messages.length} messages
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Your personal AI tutor for academic excellence
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Online
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 relative custom-scrollbar"
        >
          {!selectedChatId ? (
            // No chat selected - Welcome screen
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-violet-500/30 blur-3xl rounded-full"></div>
                <div className="relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-2xl">
                  <Bot className="w-16 h-16 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Welcome to Learnix AI
              </h3>
              <p className="text-slate-400 max-w-lg mb-10 text-lg">
                Your intelligent study companion is ready to help you excel in your academics.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl w-full">
                {[
                  {
                    icon: BookOpen,
                    title: "Explain Concepts",
                    desc: "Get clear explanations for complex topics",
                    color: "from-blue-500 to-cyan-500",
                    shadow: "shadow-blue-500/20",
                  },
                  {
                    icon: Lightbulb,
                    title: "Problem Solving",
                    desc: "Step-by-step solutions to tough problems",
                    color: "from-amber-500 to-orange-500",
                    shadow: "shadow-amber-500/20",
                  },
                  {
                    icon: GraduationCap,
                    title: "Exam Prep",
                    desc: "Practice questions and revision help",
                    color: "from-emerald-500 to-teal-500",
                    shadow: "shadow-emerald-500/20",
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className={`p-5 bg-slate-800/50 rounded-2xl border border-slate-700 text-left hover:border-slate-600 transition-all hover:bg-slate-800/70 group cursor-default`}
                  >
                    <div className={`p-3 bg-gradient-to-br ${feature.color} rounded-xl w-fit mb-3 shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-slate-200 mb-1">
                      {feature.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowNewChatInput(true)}
                className="mt-10 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-semibold hover:shadow-2xl hover:shadow-indigo-500/30 transition-all flex items-center gap-3 text-lg group"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                Start New Conversation
              </button>
            </div>
          ) : loadingMessages ? (
            // Loading messages
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4 relative" />
                </div>
                <p className="text-slate-400 text-sm">Loading conversation...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            // Empty chat
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="p-5 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-3xl mb-5 border border-indigo-500/30">
                <Sparkles className="w-12 h-12 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">
                Start the conversation
              </h3>
              <p className="text-slate-500 text-sm max-w-sm mb-6">
                Ask any question about your studies. I'm here to help you understand and learn better.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {["Explain quantum physics", "Help with calculus", "Essay writing tips"].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-sm text-slate-300 border border-slate-700 hover:border-slate-600 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Message list
            <div className="space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.isSentByUser;
                const isTemp = msg.id.startsWith("temp-");

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className={`flex items-start gap-3 max-w-[85%] ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                          isUser
                            ? "bg-gradient-to-br from-indigo-500 to-violet-500 shadow-indigo-500/25"
                            : "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/25"
                        }`}
                      >
                        {isUser ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className="group relative">
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm shadow-lg ${
                            isUser
                              ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm"
                              : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
                          } ${isTemp ? "opacity-70" : ""}`}
                        >
                          {!isUser && (
                            <span className="block text-[10px] font-bold text-emerald-400 mb-2 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Learnix AI
                            </span>
                          )}
                          <div className="leading-relaxed break-words">
                            {renderMessageContent(msg.message)}
                          </div>
                          {isTemp && (
                            <div className="mt-2 flex items-center gap-1 text-white/70 text-xs">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Sending...
                            </div>
                          )}
                        </div>
                        
                        {/* Message actions */}
                        {!isTemp && (
                          <div className={`absolute top-0 ${isUser ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                            <button
                              onClick={() => copyMessage(msg.id, msg.message)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                              title="Copy message"
                            >
                              {copiedMessageId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <span className={`block text-[10px] text-slate-600 mt-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI Typing Indicator */}
              {sending && (
                <div className="flex items-start gap-3 animate-in fade-in duration-300">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-5 py-4 bg-slate-800 rounded-2xl rounded-tl-sm border border-slate-700 shadow-lg">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef}></div>
            </div>
          )}

          {/* Scroll to bottom button */}
          {showScrollButton && selectedChatId && messages.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/30 transition-all animate-in fade-in zoom-in duration-200"
            >
              <ArrowDown className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mb-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800">
          <form onSubmit={sendMessage} className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all pr-12"
                placeholder={
                  selectedChatId
                    ? "Ask anything about your studies..."
                    : "Select or create a chat to start"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!selectedChatId || sending}
                maxLength={2000}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
              />
              {input && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                  {input.length}/2000
                </span>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2 group"
              disabled={!input.trim() || !selectedChatId || sending}
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-slate-600 mt-3 text-center flex items-center justify-center gap-2">
            <Zap className="w-3 h-3 text-amber-500" />
            AI responses are for educational purposes. Always verify important information.
          </p>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(51 65 85 / 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(71 85 105 / 0.7);
        }
      `}</style>
    </div>
  );
}
