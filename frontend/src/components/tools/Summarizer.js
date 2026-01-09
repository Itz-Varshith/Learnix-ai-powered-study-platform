"use client";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Upload,
  History,
  Download,
  Loader2,
  X,
  Clock,
  ChevronRight,
  FileUp,
  MessageSquare,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = "http://localhost:9000/api/courses";

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export default function Summarizer({ courseId }) {
  const [activeTab, setActiveTab] = useState("upload"); // "upload" or "history"
  const [file, setFile] = useState(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // History state
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    if (activeTab === "history" && courseId) {
      fetchHistory();
    }
  }, [activeTab, courseId]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to view history");
        setHistoryLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(
        `${API_BASE}/get-summarized-files/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setHistoryItems(data.data || []);
      } else {
        setError(data.message || "Failed to fetch history");
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setSummary("");

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to summarize files");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);
      formData.append("userPrompt", userPrompt);

      const response = await fetch(`${API_BASE}/summarize-file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSummary(data.data.summary);
      } else {
        setError(data.message || "Failed to summarize file");
      }
    } catch (err) {
      console.error("Error summarizing file:", err);
      setError("Failed to summarize file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setFile(null);
    setUserPrompt("");
    setSummary("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);

    // Check file type
    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    if (fileExtension !== "pdf") {
      setError("Only PDF files are supported for summarization");
      return;
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setSummary("");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const openFileDialog = () => fileInputRef.current?.click();

  // Markdown components styling for history section
  const historyMarkdownComponents = {
    h1: ({ node, ...props }) => (
      <h1
        className="text-xl font-bold text-gray-900 mt-4 mb-3 pb-2 border-b border-indigo-200 first:mt-0"
        {...props}
      />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-lg font-bold text-gray-800 mt-4 mb-2" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3
        className="text-base font-semibold text-gray-800 mt-3 mb-2"
        {...props}
      />
    ),
    p: ({ node, ...props }) => (
      <p className="text-gray-700 text-sm leading-7 mb-3" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul
        className="list-disc list-inside space-y-1.5 mb-3 text-gray-700 text-sm"
        {...props}
      />
    ),
    ol: ({ node, ...props }) => (
      <ol
        className="list-decimal list-inside space-y-1.5 mb-3 text-gray-700 text-sm"
        {...props}
      />
    ),
    li: ({ node, ...props }) => <li className="leading-6" {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-3 border-indigo-300 bg-white pl-3 py-2 my-3 text-gray-600 italic text-sm rounded-r"
        {...props}
      />
    ),
    code: ({ node, inline, ...props }) =>
      inline ? (
        <code
          className="bg-white text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono"
          {...props}
        />
      ) : (
        <code
          className="block bg-gray-800 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-3"
          {...props}
        />
      ),
    pre: ({ node, ...props }) => (
      <pre className="bg-gray-800 rounded-lg overflow-hidden my-3" {...props} />
    ),
    strong: ({ node, ...props }) => (
      <strong className="font-semibold text-gray-900" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a
        className="text-indigo-600 hover:text-indigo-800 underline text-sm"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
  };

  return (
    <div className="w-full mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-violet-100 to-indigo-100 text-indigo-600 rounded-2xl mb-4 ring-4 ring-indigo-50 shadow-sm">
          <Sparkles size={28} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          AI Document Summarizer
        </h2>
        <p className="text-gray-500 mt-2 max-w-lg mx-auto">
          Upload PDF documents and get AI-powered summaries in seconds. View
          your summarization history anytime.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "upload"
                ? "bg-white text-indigo-600 shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileUp size={18} />
            Upload & Summarize
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "history"
                ? "bg-white text-indigo-600 shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <History size={18} />
            History
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-red-700 text-sm font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {activeTab === "upload" ? (
        /* Upload & Summarize Tab */
        <div className="space-y-6">
          {/* --- UPLOAD SECTION --- */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-300 ${
              dragActive
                ? "border-indigo-500 ring-4 ring-indigo-100"
                : "border-gray-200 hover:border-indigo-200"
            }`}
          >
            <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Upload size={14} />
                Upload PDF
              </span>
              {file && (
                <button
                  onClick={handleClear}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            <div className="p-8">
              {file ? (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* File Info Row */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center shadow-sm">
                      <FileText size={28} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 break-all">
                        {file.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium flex items-center gap-1.5">
                      <Check size={14} />
                      Ready
                    </div>
                  </div>

                  {/* Prompt Input */}
                  <div className="relative">
                    <div className="absolute left-4 top-3.5 text-gray-400">
                      <MessageSquare size={18} />
                    </div>
                    <textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Optional: Add specific instructions for the summary (e.g., 'Focus on key concepts', 'Make it concise', 'Include examples'...)"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                      rows={2}
                    />
                  </div>

                  {/* Summarize Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSummarize}
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Sparkles size={20} />
                      )}
                      {loading ? "Analyzing..." : "Summarize Now"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={openFileDialog}
                  className="cursor-pointer py-12 flex flex-col items-center justify-center text-center group"
                >
                  <div
                    className={`p-6 rounded-2xl mb-5 transition-all duration-300 ${
                      dragActive
                        ? "bg-indigo-100 scale-110"
                        : "bg-gradient-to-br from-indigo-50 to-purple-50 group-hover:scale-110"
                    }`}
                  >
                    <Upload
                      size={48}
                      className={`transition-colors ${
                        dragActive
                          ? "text-indigo-600"
                          : "text-indigo-400 group-hover:text-indigo-600"
                      }`}
                    />
                  </div>
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    {dragActive ? "Drop your PDF here" : "Drag & drop your PDF"}
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    or click to browse files
                  </p>
                  <span className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    .PDF only • Max 10MB
                  </span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf"
              className="hidden"
            />
          </div>

          {/* --- LOADING STATE --- */}
          {loading && (
            <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-lg shadow-indigo-50 p-16 animate-in fade-in duration-300">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative w-24 h-24">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  <Sparkles
                    size={28}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600"
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg text-indigo-600 font-semibold animate-pulse">
                    Analyzing your document...
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Our AI is reading and summarizing the key points
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- OUTPUT SECTION --- */}
          {summary && !loading && (
            <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-lg shadow-indigo-50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Header */}
              <div className="p-6 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Sparkles size={24} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Generated Summary
                      </h3>
                      {file && (
                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                          <FileText size={14} />
                          {file.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy Summary
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Summary Content */}
              <div className="p-8 lg:p-10 max-h-[70vh] overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-3xl font-bold text-gray-900 mt-8 mb-5 pb-3 border-b-2 border-indigo-100 first:mt-0"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-2xl font-bold text-gray-800 mt-8 mb-4"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-xl font-semibold text-gray-800 mt-6 mb-3"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="text-gray-700 text-base leading-8 mb-5"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="list-none space-y-3 mb-6 text-gray-700"
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          className="list-decimal list-outside ml-6 space-y-3 mb-6 text-gray-700"
                          {...props}
                        />
                      ),
                      li: ({ node, children, ...props }) => (
                        <li
                          className="text-base leading-7 pl-2 relative before:content-['•'] before:absolute before:-left-4 before:text-indigo-500 before:font-bold"
                          {...props}
                        >
                          {children}
                        </li>
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-indigo-400 bg-indigo-50 pl-6 pr-4 py-4 my-6 text-gray-700 italic rounded-r-xl"
                          {...props}
                        />
                      ),
                      code: ({ node, inline, ...props }) =>
                        inline ? (
                          <code
                            className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-sm font-mono font-medium"
                            {...props}
                          />
                        ) : (
                          <code
                            className="block bg-gray-900 text-gray-100 p-5 rounded-xl text-sm font-mono overflow-x-auto my-6"
                            {...props}
                          />
                        ),
                      pre: ({ node, ...props }) => (
                        <pre
                          className="bg-gray-900 rounded-xl overflow-hidden my-6"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-bold text-gray-900"
                          {...props}
                        />
                      ),
                      em: ({ node, ...props }) => (
                        <em className="italic text-gray-700" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                      hr: ({ node, ...props }) => (
                        <hr className="my-8 border-gray-200" {...props} />
                      ),
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-gray-200">
                          <table className="min-w-full" {...props} />
                        </div>
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          className="bg-gray-50 px-5 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200"
                          {...props}
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td
                          className="px-5 py-3 text-sm text-gray-700 border-b border-gray-100"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {summary}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* --- EMPTY STATE (no summary yet) --- */}
          {!summary && !loading && !file && (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-600">
                Your summary will appear here
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Upload a PDF document to get started
              </p>
            </div>
          )}
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <History size={20} className="text-indigo-600" />
              Summarization History
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              View your previously summarized documents
            </p>
          </div>

          {historyLoading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2
                className="animate-spin text-indigo-600 mb-4"
                size={40}
              />
              <span className="text-gray-600 font-medium">
                Loading history...
              </span>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <History size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">
                No summaries yet
              </p>
              <p className="text-gray-500 text-sm max-w-sm">
                Upload a PDF document and summarize it to see your history here.
              </p>
              <button
                onClick={() => setActiveTab("upload")}
                className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <FileUp size={18} />
                Upload your first document
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {historyItems.map((item, index) => (
                <div key={index} className="transition-all duration-300">
                  {/* Summary Header */}
                  <div
                    onClick={() =>
                      setExpandedItem(expandedItem === index ? null : index)
                    }
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                        <FileText size={24} className="text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {item.fileName || "Unknown File"}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={item.fileURL}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Download PDF"
                      >
                        <Download size={20} />
                      </a>
                      <ChevronRight
                        size={20}
                        className={`text-gray-400 transition-transform duration-300 ${
                          expandedItem === index ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Summary Content */}
                  {expandedItem === index && (
                    <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-6 border border-indigo-100">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                            Summary
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.summary);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
                          >
                            {copied ? (
                              <>
                                <Check size={14} />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={historyMarkdownComponents}
                          >
                            {item.summary}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
