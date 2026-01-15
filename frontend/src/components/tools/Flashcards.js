"use client";
import { useState, useEffect, useRef } from "react";
import {
  Layers,
  FileText,
  Upload,
  History,
  Download,
  Loader2,
  X,
  Clock,
  ChevronRight,
  ChevronLeft,
  FileUp,
  RotateCcw,
  Hash,
} from "lucide-react";
import { auth } from "@/lib/firebase";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/courses`;

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

// Flashcard component with flip animation
const FlashCard = ({ card, index, flipped, onFlip }) => {
  return (
    <div
      onClick={() => onFlip(index)}
      className="h-56 cursor-pointer group"
      style={{ perspective: "1000px" }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500`}
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front - Question */}
        <div
          className="absolute w-full h-full bg-white border-2 border-indigo-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm group-hover:border-indigo-300 group-hover:shadow-md transition-all"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="absolute top-4 left-4 text-xs font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-full">
            Q{index + 1}
          </span>
          <p className="font-semibold text-gray-800 leading-relaxed">
            {card.question}
          </p>
          <span className="absolute bottom-4 text-xs text-gray-400 flex items-center gap-1">
            <RotateCcw size={12} />
            Click to reveal answer
          </span>
        </div>

        {/* Back - Answer */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="absolute top-4 left-4 text-xs font-bold text-indigo-200 bg-indigo-500/30 px-2 py-1 rounded-full">
            A{index + 1}
          </span>
          <p className="font-medium text-white leading-relaxed">{card.answer}</p>
        </div>
      </div>
    </div>
  );
};

export default function Flashcards({ courseId }) {
  const [activeTab, setActiveTab] = useState("generate"); // "generate" or "history"
  const [file, setFile] = useState(null);
  const [nCards, setNCards] = useState(10);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [flippedCards, setFlippedCards] = useState({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "single"
  const fileInputRef = useRef(null);

  // History state
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const [historyFlippedCards, setHistoryFlippedCards] = useState({});

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
        `${API_BASE}/get-flashcards-history/${courseId}`,
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

  const handleGenerate = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setFlashcards([]);
      setFlippedCards({});
      setCurrentCardIndex(0);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to generate flashcards");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);
      formData.append("nCards", nCards);

      const response = await fetch(`${API_BASE}/generate-flashcards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setFlashcards(data.data.flashcards);
      } else {
        setError(data.message || "Failed to generate flashcards");
      }
    } catch (err) {
      console.error("Error generating flashcards:", err);
      setError("Failed to generate flashcards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setFlashcards([]);
    setError(null);
    setFlippedCards({});
    setCurrentCardIndex(0);
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

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    if (fileExtension !== "pdf") {
      setError("Only PDF files are supported");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setFlashcards([]);
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

  const toggleFlip = (index) => {
    setFlippedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleHistoryFlip = (itemId, index) => {
    const key = `${itemId}-${index}`;
    setHistoryFlippedCards((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

    return (
    <div className="w-full mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600 rounded-2xl mb-4 ring-4 ring-orange-50 shadow-sm">
          <Layers size={28} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">AI Flashcard Generator</h2>
        <p className="text-gray-500 mt-2 max-w-lg mx-auto">
          Upload PDF documents and generate smart flashcards for effective study sessions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "generate"
                ? "bg-white text-orange-600 shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileUp size={18} />
            Generate Flashcards
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "history"
                ? "bg-white text-orange-600 shadow-md"
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

      {activeTab === "generate" ? (
        <div className="space-y-6">
          {/* --- UPLOAD SECTION --- */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-300 ${
              dragActive
                ? "border-orange-500 ring-4 ring-orange-100"
                : "border-gray-200 hover:border-orange-200"
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
                  </div>

                  {/* Number of Cards Input */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Hash size={18} />
                        <span className="text-sm font-medium">Number of flashcards:</span>
                      </div>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={nCards}
                        onChange={(e) => setNCards(Math.min(30, Math.max(5, parseInt(e.target.value) || 10)))}
                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <span className="text-xs text-gray-400">(5-30)</span>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Layers size={20} />
                      )}
                      {loading ? "Generating..." : "Generate Flashcards"}
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
                        ? "bg-orange-100 scale-110"
                        : "bg-gradient-to-br from-orange-50 to-amber-50 group-hover:scale-110"
                    }`}
                  >
                    <Upload
                      size={48}
                      className={`transition-colors ${
                        dragActive
                          ? "text-orange-600"
                          : "text-orange-400 group-hover:text-orange-600"
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
            <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-lg shadow-orange-50 p-16 animate-in fade-in duration-300">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative w-24 h-24">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-100 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                  <Layers
                    size={28}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-600"
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg text-orange-600 font-semibold animate-pulse">
                    Generating flashcards...
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Our AI is creating {nCards} flashcards from your document
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- OUTPUT SECTION --- */}
          {flashcards.length > 0 && !loading && (
            <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-lg shadow-orange-50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="p-6 border-b border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Layers size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Generated Flashcards
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {flashcards.length} cards created from {file?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === "grid"
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode("single")}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === "single"
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Study
                    </button>
                  </div>
                </div>
              </div>

              {/* Flashcards Content */}
              <div className="p-6">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {flashcards.map((card, index) => (
                      <FlashCard
                        key={index}
                        card={card}
                        index={index}
                        flipped={flippedCards[index]}
                        onFlip={toggleFlip}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-lg">
                      <FlashCard
                        card={flashcards[currentCardIndex]}
                        index={currentCardIndex}
                        flipped={flippedCards[currentCardIndex]}
                        onFlip={toggleFlip}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                      <button
                        onClick={prevCard}
                        disabled={currentCardIndex === 0}
                        className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <span className="text-sm font-medium text-gray-600">
                        {currentCardIndex + 1} / {flashcards.length}
                      </span>
                      <button
                        onClick={nextCard}
                        disabled={currentCardIndex === flashcards.length - 1}
                        className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- EMPTY STATE --- */}
          {flashcards.length === 0 && !loading && !file && (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Layers size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-600">
                Your flashcards will appear here
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
              <History size={20} className="text-orange-600" />
              Flashcards History
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              View your previously generated flashcards
            </p>
          </div>

          {historyLoading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-orange-600 mb-4" size={40} />
              <span className="text-gray-600 font-medium">Loading history...</span>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <History size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">
                No flashcards yet
              </p>
              <p className="text-gray-500 text-sm max-w-sm">
                Generate flashcards from a PDF document to see your history here.
              </p>
              <button
                onClick={() => setActiveTab("generate")}
                className="mt-6 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all flex items-center gap-2"
              >
                <FileUp size={18} />
                Generate your first flashcards
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {historyItems.map((item, index) => (
                <div key={item.id || index} className="transition-all duration-300">
                  {/* History Item Header */}
                  <div
                    onClick={() =>
                      setExpandedItem(expandedItem === index ? null : index)
                    }
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Layers size={24} className="text-orange-500" />
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
                          <span className="text-orange-600 font-medium">
                            {item.flashcards?.length || 0} cards
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={item.fileURL}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
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

                  {/* Expanded Flashcards */}
                  {expandedItem === index && (
                    <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {item.flashcards?.map((card, cardIndex) => (
                            <div
                              key={cardIndex}
                              onClick={() => toggleHistoryFlip(item.id, cardIndex)}
                              className="h-44 cursor-pointer"
                              style={{ perspective: "1000px" }}
                            >
                              <div
                                className="relative w-full h-full transition-transform duration-500"
                                style={{
                                  transformStyle: "preserve-3d",
                                  transform: historyFlippedCards[`${item.id}-${cardIndex}`]
                                    ? "rotateY(180deg)"
                                    : "rotateY(0deg)",
                                }}
                              >
                                {/* Front */}
                                <div
                                  className="absolute w-full h-full bg-white border border-orange-200 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm"
                                  style={{ backfaceVisibility: "hidden" }}
                                >
                                  <span className="absolute top-2 left-2 text-xs font-bold text-orange-400">
                                    Q{cardIndex + 1}
                                  </span>
                                  <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                    {card.question}
                                  </p>
                                </div>
                                {/* Back */}
                                <div
                                  className="absolute w-full h-full bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-4 flex flex-col items-center justify-center text-center"
                                  style={{
                                    backfaceVisibility: "hidden",
                                    transform: "rotateY(180deg)",
                                  }}
                                >
                                  <span className="absolute top-2 left-2 text-xs font-bold text-orange-200">
                                    A{cardIndex + 1}
                                  </span>
                                  <p className="text-sm font-medium text-white leading-relaxed">
                                    {card.answer}
                                  </p>
                                </div>
                            </div>
                            </div>
                          ))}
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
