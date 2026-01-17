"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Loader2,
  Bot,
  User,
  Menu,
  X,
  Clock,
  ChevronLeft,
  Search,
  Copy,
  Check,
  ArrowDown,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Animated text component for flowing AI responses
function AnimatedMessage({ content, renderMarkdown, isNew }) {
  const [displayedContent, setDisplayedContent] = useState(isNew ? "" : content);
  const [isAnimating, setIsAnimating] = useState(isNew);

  useEffect(() => {
    if (!isNew || !content) {
      setDisplayedContent(content);
      setIsAnimating(false);
      return;
    }

    let currentIndex = 0;
    const words = content.split(" ");
    const totalWords = words.length;
    
    // Faster animation for longer messages
    const baseDelay = totalWords > 100 ? 15 : totalWords > 50 ? 25 : 35;
    
    const animateText = () => {
      if (currentIndex < totalWords) {
        const wordsToAdd = totalWords > 200 ? 3 : totalWords > 100 ? 2 : 1;
        currentIndex = Math.min(currentIndex + wordsToAdd, totalWords);
        setDisplayedContent(words.slice(0, currentIndex).join(" "));
        setTimeout(animateText, baseDelay);
      } else {
        setIsAnimating(false);
      }
    };

    animateText();
  }, [content, isNew]);

  return (
    <div className={`transition-opacity duration-300 ${isAnimating ? "animate-pulse-subtle" : ""}`}>
      <div className="prose-sm max-w-none">
        {renderMarkdown(displayedContent)}
      </div>
      {isAnimating && (
        <span className="inline-block w-2 h-4 bg-emerald-500 ml-1 animate-blink rounded-sm" />
      )}
    </div>
  );
}

export default function AiDoubtSolver() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewChatInput, setShowNewChatInput] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState(new Set());

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const newChatInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-collapse sidebar on mount
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (!showScrollButton) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollButton]);

  useEffect(() => {
    if (showNewChatInput) {
      newChatInputRef.current?.focus();
    }
  }, [showNewChatInput]);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  const copyMessage = async (messageId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setChats(data.data || []);
        if (data.data?.length > 0 && !selectedChatId) {
          setSelectedChatId(data.data[0].id);
        }
      } else {
        setError(data.message || "Failed to load chats");
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load chats.");
    } finally {
      setLoadingChats(false);
    }
  }, [selectedChatId]);

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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setMessages(data.data || []);
      } else {
        setError(data.message || "Failed to load messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    } else {
      setMessages([]);
    }
  }, [selectedChatId, fetchMessages]);

  const createChat = async (e) => {
    e?.preventDefault();
    const chatName = newChatName.trim() || `Chat ${new Date().toLocaleDateString()}`;
    try {
      setCreatingChat(true);
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in");
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
      setError("Failed to create chat.");
    } finally {
      setCreatingChat(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || sending || !selectedChatId) return;

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
        setError("Please sign in");
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
        // Mark AI message as new for animation
        setNewMessageIds((prev) => new Set([...prev, data.data.aiMessage.id]));
        // Clear the "new" flag after animation completes
        setTimeout(() => {
          setNewMessageIds((prev) => {
            const next = new Set(prev);
            next.delete(data.data.aiMessage.id);
            return next;
          });
        }, 5000);
        
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...filtered, data.data.userMessage, data.data.aiMessage];
        });
        setChats((prev) => {
          const updated = prev.map((chat) =>
            chat.id === selectedChatId
              ? { ...chat, updatedAt: new Date().toISOString() }
              : chat
          );
          return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });
      } else {
        setError(data.message || "Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message.");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Enhanced markdown renderer
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
          <ListTag key={`list-${elements.length}`} className={`my-2 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside space-y-1 text-slate-700`}>
            {listItems.map((item, i) => (
              <li key={i} className="leading-relaxed">{renderInlineMarkdown(item)}</li>
            ))}
          </ListTag>
        );
        listItems = [];
        listType = null;
      }
    };

    const renderInlineMarkdown = (text) => {
      // Process inline elements: bold, italic, code, math
      const parts = [];
      let remaining = text;
      let key = 0;

      while (remaining.length > 0) {
        // Math notation $...$
        const mathMatch = remaining.match(/^\$([^$]+)\$/);
        if (mathMatch) {
          parts.push(
            <span key={key++} className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded">
              {mathMatch[1]}
            </span>
          );
          remaining = remaining.slice(mathMatch[0].length);
          continue;
        }

        // Bold **...**
        const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
        if (boldMatch) {
          parts.push(<strong key={key++} className="font-semibold text-slate-900">{boldMatch[1]}</strong>);
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
            <code key={key++} className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-[13px] font-mono">
              {codeMatch[1]}
            </code>
          );
          remaining = remaining.slice(codeMatch[0].length);
          continue;
        }

        // Find next special char
        const nextSpecial = remaining.search(/[\$\*`]/);
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
            <div key={`code-${elements.length}`} className="my-3 rounded-lg overflow-hidden bg-slate-900 border border-slate-200">
              {codeBlockLang && (
                <div className="px-3 py-1.5 bg-slate-800 text-xs text-slate-400 font-mono border-b border-slate-700">
                  {codeBlockLang}
                </div>
              )}
              <pre className="p-4 overflow-x-auto">
                <code className="text-emerald-400 font-mono text-sm leading-relaxed">
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
          <h4 key={`h4-${elements.length}`} className="text-base font-semibold text-slate-800 mt-4 mb-2">
            {renderInlineMarkdown(h4Match[1])}
          </h4>
        );
        continue;
      }

      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        flushList();
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-lg font-semibold text-slate-800 mt-5 mb-2">
            {renderInlineMarkdown(h3Match[1])}
          </h3>
        );
        continue;
      }

      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        flushList();
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-xl font-bold text-slate-900 mt-6 mb-3">
            {renderInlineMarkdown(h2Match[1])}
          </h2>
        );
        continue;
      }

      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        flushList();
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-2xl font-bold text-slate-900 mt-6 mb-3">
            {renderInlineMarkdown(h1Match[1])}
          </h1>
        );
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
          <div key={`letter-${elements.length}`} className="my-2">
            <span className="font-semibold text-slate-800">{letterMatch[1]}. </span>
            <span className="text-slate-700">{renderInlineMarkdown(letterMatch[2])}</span>
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
        <p key={`p-${elements.length}`} className="my-2 leading-relaxed text-slate-700">
          {renderInlineMarkdown(line)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  const filteredChats = chats.filter((chat) =>
    chat.chatName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  if (loadingChats && chats.length === 0) {
    return (
      <div className="flex h-full bg-white overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-60" : "w-0"} transition-all duration-200 bg-slate-50 border-r border-slate-100 flex flex-col overflow-hidden`}>
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-slate-700 text-sm">History</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-200 rounded">
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-300"
            />
          </div>

          {showNewChatInput ? (
            <form onSubmit={createChat} className="flex gap-1.5">
              <input
                ref={newChatInputRef}
                type="text"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder="Name..."
                className="flex-1 px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-300"
                disabled={creatingChat}
              />
              <button type="submit" disabled={creatingChat} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50">
                {creatingChat ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Plus className="w-3.5 h-3.5 text-white" />}
              </button>
              <button type="button" onClick={() => { setShowNewChatInput(false); setNewChatName(""); }} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg">
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </form>
          ) : (
            <button onClick={() => setShowNewChatInput(true)} className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium">
              <Plus className="w-3.5 h-3.5" /> New Chat
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No chats</div>
          ) : (
            <div className="py-1">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full text-left px-3 py-2.5 transition-colors text-xs ${
                    selectedChatId === chat.id ? "bg-slate-100" : "hover:bg-slate-100/50"
                  }`}
                >
                  <p className={`font-medium truncate ${selectedChatId === chat.id ? "text-slate-900" : "text-slate-600"}`}>
                    {chat.chatName}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatTime(chat.updatedAt || chat.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <div className="h-14 px-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${sidebarOpen ? 'hidden' : ''}`}>
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-slate-800 truncate">{selectedChat?.chatName || "AI Doubt Solver"}</h1>
          </div>
          <button
            onClick={() => { setShowNewChatInput(true); setSidebarOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto relative">
          {!selectedChatId ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-slate-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">How can I help you?</h2>
              <p className="text-slate-500 text-sm mb-6 max-w-sm">Ask any academic question and get instant explanations.</p>
              <button
                onClick={() => { setSidebarOpen(true); setShowNewChatInput(true); }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Start a conversation
              </button>
            </div>
          ) : loadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Sparkles className="w-8 h-8 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">Send a message to start</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((msg) => {
                const isUser = msg.isSentByUser;
                const isTemp = msg.id.startsWith("temp-");

                return (
                  <div key={msg.id} className={`mb-6 ${isTemp ? "opacity-60" : ""}`}>
                    {/* Avatar + Name row */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isUser ? "bg-slate-200" : "bg-emerald-100"}`}>
                        {isUser ? <User className="w-4 h-4 text-slate-600" /> : <Sparkles className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <span className={`text-sm font-medium ${isUser ? "text-slate-700" : "text-emerald-700"}`}>
                        {isUser ? "You" : "Learnix AI"}
                      </span>
                    </div>

                    {/* Message content */}
                    <div className="pl-9 group relative">
                      <div className={`text-[15px] leading-relaxed ${isUser ? "text-slate-800" : "text-slate-700"}`}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        ) : (
                          <AnimatedMessage 
                            content={msg.message} 
                            renderMarkdown={renderMarkdown} 
                            isNew={newMessageIds.has(msg.id)} 
                          />
                        )}
                      </div>

                      {isTemp && (
                        <div className="mt-2 flex items-center gap-1 text-slate-400 text-xs">
                          <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                        </div>
                      )}

                      {/* Actions */}
                      {!isTemp && !isUser && (
                        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyMessage(msg.id, msg.message)}
                            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                            title="Copy"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* AI Typing */}
              {sending && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-emerald-700">Learnix AI</span>
                  </div>
                  <div className="pl-9">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef}></div>
            </div>
          )}

          {showScrollButton && selectedChatId && messages.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 p-2.5 bg-white border border-slate-200 rounded-full shadow-lg hover:shadow-xl transition-all z-10"
            >
              <ArrowDown className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={sendMessage} className="relative">
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 disabled:opacity-50 transition-all"
                placeholder={selectedChatId ? "Message Learnix AI..." : "Start a new chat to begin"}
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
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                disabled={!input.trim() || !selectedChatId || sending}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            <p className="text-center text-[11px] text-slate-400 mt-2">AI can make mistakes. Verify important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
