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
  Sparkles,
  BrainCircuit
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
      className="h-64 cursor-pointer group perspective-1000"
      style={{ perspective: "1000px" }}
    >
      <div
        className={`relative w-full h-full transition-all duration-500 transform-style-3d`}
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front - Question */}
        <div
          className="absolute w-full h-full bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              Question {index + 1}
            </span>
          </div>
          
          <p className="font-semibold text-gray-800 text-lg leading-relaxed px-2">
            {card.question}
          </p>
          
          <span className="absolute bottom-6 text-xs font-medium text-gray-400 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
            <RotateCcw size={12} />
            Tap to flip
          </span>
        </div>

        {/* Back - Answer */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-indigo-200"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="absolute top-4 left-4">
            <span className="text-xs font-bold text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
              Answer
            </span>
          </div>
          
          <p className="font-medium text-white text-lg leading-relaxed px-2 drop-shadow-sm">
            {card.answer}
          </p>
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
    <div className="w-full mx-auto animate-in fade-in duration-500 font-sans">
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 rounded-2xl mb-4 border border-indigo-100 shadow-sm">
          <BrainCircuit size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">AI Flashcard Generator</h2>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto text-sm leading-relaxed">
          Upload your study materials and let our AI create the perfect revision deck for you in seconds.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "generate"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-100/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
            }`}
          >
            <Sparkles size={16} />
            Generate
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "history"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-100/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
            }`}
          >
            <History size={16} />
            History
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center gap-3">
             <div className="p-1.5 bg-red-100 text-red-600 rounded-full"><X size={14} /></div>
             <span className="text-red-700 text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-700 text-sm font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === "generate" ? (
        <div className="space-y-8">
          {/* --- UPLOAD SECTION --- */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`bg-white rounded-2xl border border-dashed shadow-sm overflow-hidden transition-all duration-300 ${
              dragActive
                ? "border-indigo-500 ring-4 ring-indigo-50 bg-indigo-50/30"
                : "border-gray-300 hover:border-indigo-300 hover:shadow-md"
            }`}
          >
            {/* Context Header for Upload Box */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-2">
                <FileUp size={14} />
                Source Material
              </span>
              {file && (
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1.5 font-medium transition-colors bg-white px-2 py-1 rounded border border-gray-200"
                >
                  Clear File <X size={12} />
                </button>
              )}
            </div>

            <div className="p-8">
              {file ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* File Info Row */}
                  <div className="flex items-center gap-5 p-4 bg-gradient-to-r from-indigo-50/50 to-white border border-indigo-100 rounded-xl">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-50">
                      <FileText size={24} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {file.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span>PDF Document</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </p>
                    </div>
                  </div>

                  {/* Settings Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                           <Hash size={16} />
                        </div>
                        <span className="text-sm font-medium">Card Count</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="5"
                          max="30"
                          value={nCards}
                          onChange={(e) => setNCards(Math.min(30, Math.max(5, parseInt(e.target.value) || 10)))}
                          className="w-20 pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col -space-y-1 opacity-40 pointer-events-none">
                            <span className="text-[8px] leading-3">▲</span>
                            <span className="text-[8px] leading-3">▼</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">5-30 cards</span>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Sparkles size={18} />
                      )}
                      {loading ? "Analyzing..." : "Generate Deck"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={openFileDialog}
                  className="cursor-pointer py-8 flex flex-col items-center justify-center text-center group"
                >
                  <div
                    className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center transition-all duration-300 ${
                      dragActive
                        ? "bg-indigo-100 text-indigo-600 scale-110"
                        : "bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-105"
                    }`}
                  >
                    <Upload size={28} />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-1">
                    {dragActive ? "Drop PDF now" : "Upload Course Material"}
                  </p>
                  <p className="text-gray-500 text-sm mb-4 max-w-xs mx-auto">
                    Drag and drop your PDF lecture notes or click to browse.
                  </p>
                  <span className="inline-flex items-center px-3 py-1 bg-gray-50 border border-gray-100 text-gray-500 text-xs font-medium rounded-full">
                    PDF Only • Max 10MB
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-indigo-100/50 p-12 animate-in fade-in duration-500">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
                  <div className="relative p-4 bg-white rounded-full border border-indigo-50 shadow-sm">
                    <Loader2 size={32} className="text-indigo-600 animate-spin" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Generating Flashcards
                  </h3>
                  <p className="text-sm text-gray-500">
                    Analyzing content and creating {nCards} cards...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- OUTPUT SECTION --- */}
          {flashcards.length > 0 && !loading && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
                    <Layers size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Generated Deck
                    </h3>
                    <p className="text-xs text-gray-500">
                      {flashcards.length} cards • {file?.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      viewMode === "grid"
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Grid View
                  </button>
                  <div className="w-px h-4 bg-gray-200 mx-1"></div>
                  <button
                    onClick={() => setViewMode("single")}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      viewMode === "single"
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Focus Mode
                  </button>
                </div>
              </div>

              {/* Flashcards Content */}
              <div className="p-8 bg-slate-50/50">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="flex flex-col items-center py-4">
                    <div className="w-full max-w-xl mx-auto">
                      <FlashCard
                        card={flashcards[currentCardIndex]}
                        index={currentCardIndex}
                        flipped={flippedCards[currentCardIndex]}
                        onFlip={toggleFlip}
                      />
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-6 mt-8">
                      <button
                        onClick={prevCard}
                        disabled={currentCardIndex === 0}
                        className="p-4 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-900">
                          {currentCardIndex + 1} <span className="text-gray-400 text-sm font-normal">/ {flashcards.length}</span>
                        </span>
                        <div className="w-32 h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                           <div 
                              className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
                              style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                           ></div>
                        </div>
                      </div>
                      
                      <button
                        onClick={nextCard}
                        disabled={currentCardIndex === flashcards.length - 1}
                        className="p-4 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <History size={18} className="text-indigo-600" />
              Generated Collections
            </h3>
            <span className="text-xs font-medium bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-500">
               {historyItems.length} items
            </span>
          </div>

          {historyLoading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
              <span className="text-gray-500 text-sm font-medium">Retrieving history...</span>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                <History size={32} className="text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1">
                No flashcards found
              </p>
              <p className="text-gray-500 text-sm max-w-xs mb-6">
                Your generated flashcard collections will appear here safely.
              </p>
              <button
                onClick={() => setActiveTab("generate")}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
              >
                Create New Deck
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {historyItems.map((item, index) => (
                <div key={item.id || index} className="group transition-all duration-300 hover:bg-gray-50/50">
                  {/* History Item Header */}
                  <div
                    onClick={() =>
                      setExpandedItem(expandedItem === index ? null : index)
                    }
                    className="p-5 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${expandedItem === index ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-200 text-indigo-600 group-hover:border-indigo-200"}`}>
                        <Layers size={22} />
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${expandedItem === index ? "text-indigo-700" : "text-gray-900"}`}>
                          {item.fileName || "Unknown File"}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(item.createdAt)}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="font-medium text-gray-700">
                            {item.flashcards?.length || 0} cards
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={item.fileURL}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download Source PDF"
                      >
                        <Download size={18} />
                      </a>
                      <div className={`p-2 rounded-lg transition-all ${expandedItem === index ? "bg-indigo-50 text-indigo-600" : "text-gray-400"}`}>
                         <ChevronRight
                            size={18}
                            className={`transition-transform duration-300 ${
                              expandedItem === index ? "rotate-90" : ""
                            }`}
                          />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Flashcards */}
                  {expandedItem === index && (
                    <div className="px-5 pb-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200/60 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {item.flashcards?.map((card, cardIndex) => (
                            <div
                              key={cardIndex}
                              onClick={() => toggleHistoryFlip(item.id, cardIndex)}
                              className="h-48 cursor-pointer perspective-1000"
                              style={{ perspective: "1000px" }}
                            >
                              <div
                                className="relative w-full h-full transition-transform duration-500 transform-style-3d"
                                style={{
                                  transformStyle: "preserve-3d",
                                  transform: historyFlippedCards[`${item.id}-${cardIndex}`]
                                    ? "rotateY(180deg)"
                                    : "rotateY(0deg)",
                                }}
                              >
                                {/* Front */}
                                <div
                                  className="absolute w-full h-full bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm hover:border-indigo-300 transition-colors"
                                  style={{ backfaceVisibility: "hidden" }}
                                >
                                  <span className="absolute top-3 left-3 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                                    Q{cardIndex + 1}
                                  </span>
                                  <p className="text-sm font-medium text-gray-800 leading-relaxed px-2">
                                    {card.question}
                                  </p>
                                </div>
                                
                                {/* Back */}
                                <div
                                  className="absolute w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-md"
                                  style={{
                                    backfaceVisibility: "hidden",
                                    transform: "rotateY(180deg)",
                                  }}
                                >
                                  <span className="absolute top-3 left-3 text-[10px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                                    A{cardIndex + 1}
                                  </span>
                                  <p className="text-sm font-medium text-white leading-relaxed px-2">
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