"use client";
import { useState, useEffect, useRef } from "react";
import {
  BrainCircuit,
  FileText,
  Upload,
  History,
  Download,
  Loader2,
  X,
  Clock,
  ChevronRight,
  FileUp,
  Hash,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Play,
  HelpCircle,
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

export default function Quiz({ courseId }) {
  const [activeTab, setActiveTab] = useState("generate"); // "generate" or "history"
  const [file, setFile] = useState(null);
  const [nQuestions, setNQuestions] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // History state
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const [historyQuizState, setHistoryQuizState] = useState({});

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
        `${API_BASE}/get-quiz-history/${courseId}`,
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
      setQuestions([]);
      setQuizStarted(false);
      setShowResults(false);
      setSelectedAnswers({});
      setCurrentQuestion(0);
      setScore(0);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to generate quiz");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);
      formData.append("nQuestions", nQuestions);

      const response = await fetch(`${API_BASE}/generate-quiz`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setQuestions(data.data.questions);
      } else {
        setError(data.message || "Failed to generate quiz");
      }
    } catch (err) {
      console.error("Error generating quiz:", err);
      setError("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setQuestions([]);
    setError(null);
    setQuizStarted(false);
    setShowResults(false);
    setSelectedAnswers({});
    setCurrentQuestion(0);
    setScore(0);
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
    setQuestions([]);
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

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const selectAnswer = (questionIndex, answer) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitQuiz = () => {
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResults(true);
  };

  const retakeQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  // Start history quiz
  const startHistoryQuiz = (itemId, questions) => {
    setHistoryQuizState((prev) => ({
      ...prev,
      [itemId]: {
        started: true,
        currentQuestion: 0,
        selectedAnswers: {},
        showResults: false,
        score: 0,
        questions: questions,
      },
    }));
  };

  const selectHistoryAnswer = (itemId, questionIndex, answer) => {
    const state = historyQuizState[itemId];
    if (state?.showResults) return;
    
    setHistoryQuizState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selectedAnswers: {
          ...prev[itemId].selectedAnswers,
          [questionIndex]: answer,
        },
      },
    }));
  };

  const submitHistoryQuiz = (itemId) => {
    const state = historyQuizState[itemId];
    let correctCount = 0;
    state.questions.forEach((q, index) => {
      if (state.selectedAnswers[index] === q.answer) {
        correctCount++;
      }
    });
    
    setHistoryQuizState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        showResults: true,
        score: correctCount,
      },
    }));
  };

  const getOptionStyle = (questionIndex, option, correctAnswer, isHistory = false, itemId = null) => {
    const answers = isHistory ? historyQuizState[itemId]?.selectedAnswers : selectedAnswers;
    const results = isHistory ? historyQuizState[itemId]?.showResults : showResults;
    const selected = answers?.[questionIndex] === option;
    
    if (!results) {
      return selected
        ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-600"
        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-gray-600";
    }
    
    if (option === correctAnswer) {
      return "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium ring-1 ring-emerald-500";
    }
    if (selected && option !== correctAnswer) {
      return "border-red-500 bg-red-50 text-red-700 font-medium ring-1 ring-red-500";
    }
    return "border-gray-200 opacity-50";
  };

  return (
    <div className="w-full mx-auto animate-in fade-in duration-500 font-sans">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 rounded-2xl mb-4 border border-indigo-100 shadow-sm">
          <BrainCircuit size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">AI Quiz Generator</h2>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto leading-relaxed">
          Upload PDF documents and generate interactive practice quizzes to test your knowledge instantly.
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
            <FileUp size={16} />
            Generate Quiz
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center gap-3">
             <div className="p-1.5 bg-red-100 text-red-600 rounded-full"><X size={14} /></div>
             <span className="text-red-700 text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 text-red-400 hover:text-red-700 rounded-lg transition-colors"
          >
            <span className="text-xs font-semibold">Dismiss</span>
          </button>
        </div>
      )}

      {activeTab === "generate" ? (
        <div className="space-y-8">
          {/* --- UPLOAD SECTION --- */}
          {!quizStarted && questions.length === 0 && (
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
              {/* Context Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-2">
                  <Upload size={14} />
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
                           <span className="text-sm font-medium">Questions</span>
                        </div>
                        <div className="relative">
                            <input
                              type="number"
                              min="3"
                              max="20"
                              value={nQuestions}
                              onChange={(e) => setNQuestions(Math.min(20, Math.max(3, parseInt(e.target.value) || 5)))}
                              className="w-20 pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col -space-y-1 opacity-40 pointer-events-none">
                                <span className="text-[8px] leading-3">▲</span>
                                <span className="text-[8px] leading-3">▼</span>
                            </div>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">3-20 items</span>
                      </div>

                      <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <BrainCircuit size={18} />
                        )}
                        {loading ? "Generating..." : "Create Quiz"}
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
          )}

          {/* --- LOADING STATE --- */}
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-indigo-100/50 p-12 animate-in fade-in duration-300">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
                   <div className="relative p-4 bg-white rounded-full border border-indigo-50 shadow-sm">
                      <BrainCircuit size={32} className="text-indigo-600 animate-pulse" />
                   </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg text-gray-900 font-semibold">
                    Generating Quiz Questions
                  </p>
                  <p className="text-sm text-gray-500">
                    Analyzing content and crafting {nQuestions} questions...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- QUIZ READY TO START --- */}
          {questions.length > 0 && !quizStarted && !loading && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-10 text-center animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-100">
                <CheckCircle2 size={40} className="text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Ready!</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                We've generated {questions.length} questions from <span className="font-semibold text-gray-800">{file?.name}</span>. Good luck!
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleClear}
                  className="px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                  Generate New
                </button>
                <button
                  onClick={startQuiz}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Play size={20} fill="currentColor" />
                  Start Quiz
                </button>
              </div>
            </div>
          )}

          {/* --- QUIZ IN PROGRESS --- */}
          {quizStarted && !showResults && questions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden animate-in fade-in duration-300">
              {/* Progress Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-indigo-900 uppercase tracking-wide">
                    Question {currentQuestion + 1} <span className="text-gray-400 font-normal">/ {questions.length}</span>
                  </span>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                    <HelpCircle size={12} />
                    {Object.keys(selectedAnswers).length} answered
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="p-8 md:p-10">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 leading-snug">
                  {questions[currentQuestion].question}
                </h3>

                {/* Options */}
                <div className="space-y-3.5">
                  {Object.entries(questions[currentQuestion].options).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => selectAnswer(currentQuestion, key)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start group ${getOptionStyle(
                        currentQuestion,
                        key,
                        questions[currentQuestion].answer
                      )}`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold mr-4 transition-colors ${
                        selectedAnswers[currentQuestion] === key
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-gray-50 border-gray-300 text-gray-500 group-hover:border-indigo-400 group-hover:text-indigo-600"
                      }`}>
                        {key}
                      </span>
                      <span className="mt-0.5">{value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestion === 0}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                
                {currentQuestion === questions.length - 1 ? (
                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(selectedAnswers).length < questions.length}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl font-medium hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          )}

          {/* --- RESULTS --- */}
          {showResults && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden animate-in fade-in duration-500">
              {/* Score Header */}
              <div className="p-10 text-center bg-gradient-to-b from-indigo-50/50 to-white border-b border-gray-100">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 ${score >= questions.length / 2 ? "bg-yellow-50 border-yellow-100 text-yellow-500" : "bg-gray-50 border-gray-100 text-gray-400"}`}>
                  <Trophy size={48} fill={score >= questions.length / 2 ? "currentColor" : "none"} />
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                   <span className="text-5xl font-extrabold text-indigo-600 tracking-tight">{score}</span>
                   <span className="text-xl font-medium text-gray-400">/ {questions.length}</span>
                </div>
                <p className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${score >= questions.length / 2 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {Math.round((score / questions.length) * 100)}% Score
                </p>
                
                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={retakeQuiz}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 transition-all shadow-sm"
                  >
                    <RotateCcw size={16} />
                    Retake
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-200"
                  >
                    New Quiz
                  </button>
                </div>
              </div>

              {/* Review Answers */}
              <div className="p-8 bg-gray-50/30">
                <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                   <FileText size={18} className="text-gray-400" />
                   Review Answers
                </h4>
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={index} className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex-shrink-0">
                            {selectedAnswers[index] === q.answer ? (
                              <div className="bg-green-100 p-1.5 rounded-full text-green-600"><CheckCircle2 size={18} /></div>
                            ) : (
                              <div className="bg-red-100 p-1.5 rounded-full text-red-600"><XCircle size={18} /></div>
                            )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm mb-3">{q.question}</p>
                          
                          <div className="grid grid-cols-1 gap-2 text-sm">
                             <div className={`p-2.5 rounded-lg border flex items-center justify-between ${selectedAnswers[index] === q.answer ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                                <span><span className="font-bold opacity-70 mr-2">You:</span> {selectedAnswers[index] || "Skipped"}</span>
                             </div>
                             
                             {selectedAnswers[index] !== q.answer && (
                                <div className="p-2.5 rounded-lg border bg-green-50 border-green-200 text-green-800 flex items-center justify-between">
                                    <span><span className="font-bold opacity-70 mr-2">Correct:</span> {q.answer}</span>
                                    <CheckCircle2 size={14} />
                                </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- EMPTY STATE --- */}
          {questions.length === 0 && !loading && !file && (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center group hover:border-indigo-200 transition-colors">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                <BrainCircuit size={40} className="text-gray-300 group-hover:text-indigo-300 transition-colors" />
              </div>
              <p className="text-lg font-medium text-gray-600">
                Your quiz will appear here
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
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <History size={18} className="text-indigo-600" />
              Quiz History
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
                No quizzes found
              </p>
              <p className="text-gray-500 text-sm max-w-xs mb-6">
                Your generated quizzes will be saved here for future practice.
              </p>
              <button
                onClick={() => setActiveTab("generate")}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
              >
                <FileUp size={16} />
                Create New Quiz
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
                        <BrainCircuit size={22} />
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
                            {item.questions?.length || 0} questions
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

                  {/* Expanded Quiz */}
                  {expandedItem === index && (
                    <div className="px-5 pb-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/60 shadow-inner">
                        {!historyQuizState[item.id]?.started ? (
                          <div className="text-center py-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startHistoryQuiz(item.id, item.questions);
                              }}
                              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 flex items-center gap-2 mx-auto transition-all"
                            >
                              <Play size={18} fill="currentColor" />
                              Start Practice
                            </button>
                          </div>
                        ) : historyQuizState[item.id]?.showResults ? (
                          <div className="text-center py-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="mb-2 text-xs font-bold uppercase text-gray-400 tracking-wider">Final Score</div>
                            <p className="text-4xl font-extrabold text-indigo-600 mb-2">
                              {historyQuizState[item.id].score} <span className="text-gray-300 text-2xl">/ {item.questions.length}</span>
                            </p>
                            <p className="text-gray-500 text-sm mb-6">
                              {Math.round((historyQuizState[item.id].score / item.questions.length) * 100)}% Accuracy
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startHistoryQuiz(item.id, item.questions);
                              }}
                              className="px-4 py-2 text-indigo-600 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-all"
                            >
                              Restart Quiz
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                                Question {(historyQuizState[item.id]?.currentQuestion || 0) + 1} / {item.questions.length}
                              </span>
                            </div>
                            
                            {item.questions && item.questions[historyQuizState[item.id]?.currentQuestion || 0] && (
                              <>
                                <p className="font-bold text-gray-900 mb-6 text-lg">
                                  {item.questions[historyQuizState[item.id]?.currentQuestion || 0].question}
                                </p>
                                <div className="space-y-3 mb-8">
                                  {Object.entries(item.questions[historyQuizState[item.id]?.currentQuestion || 0].options).map(([key, value]) => (
                                    <button
                                      key={key}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectHistoryAnswer(item.id, historyQuizState[item.id]?.currentQuestion || 0, key);
                                      }}
                                      className={`w-full p-3.5 rounded-xl border text-left text-sm transition-all flex items-start ${
                                        historyQuizState[item.id]?.selectedAnswers?.[historyQuizState[item.id]?.currentQuestion || 0] === key
                                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600 font-medium"
                                          : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50 text-gray-600"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold mr-3 ${
                                         historyQuizState[item.id]?.selectedAnswers?.[historyQuizState[item.id]?.currentQuestion || 0] === key
                                         ? "bg-indigo-600 border-indigo-600 text-white"
                                         : "bg-gray-100 border-gray-300 text-gray-500"
                                      }`}>
                                        {key}
                                      </span>
                                      {value}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHistoryQuizState(prev => ({
                                        ...prev,
                                        [item.id]: {
                                          ...prev[item.id],
                                          currentQuestion: Math.max(0, (prev[item.id]?.currentQuestion || 0) - 1)
                                        }
                                      }));
                                    }}
                                    disabled={(historyQuizState[item.id]?.currentQuestion || 0) === 0}
                                    className="text-sm text-gray-400 font-medium hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Previous
                                  </button>
                                  {(historyQuizState[item.id]?.currentQuestion || 0) === item.questions.length - 1 ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        submitHistoryQuiz(item.id);
                                      }}
                                      className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
                                    >
                                      Finish Quiz
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setHistoryQuizState(prev => ({
                                          ...prev,
                                          [item.id]: {
                                            ...prev[item.id],
                                            currentQuestion: Math.min(item.questions.length - 1, (prev[item.id]?.currentQuestion || 0) + 1)
                                          }
                                        }));
                                      }}
                                      className="px-5 py-2 bg-white border border-gray-200 text-gray-900 text-sm font-semibold rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all"
                                    >
                                      Next
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
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