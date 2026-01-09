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
} from "lucide-react";
import { auth } from "@/lib/firebase";

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
        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
        : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50";
    }
    
    if (option === correctAnswer) {
      return "border-green-500 bg-green-50 text-green-700";
    }
    if (selected && option !== correctAnswer) {
      return "border-red-500 bg-red-50 text-red-700";
    }
    return "border-gray-200 opacity-50";
  };

  return (
    <div className="w-full mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 rounded-2xl mb-4 ring-4 ring-emerald-50 shadow-sm">
          <BrainCircuit size={28} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">AI Quiz Generator</h2>
        <p className="text-gray-500 mt-2 max-w-lg mx-auto">
          Upload PDF documents and generate practice quizzes to test your knowledge.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "generate"
                ? "bg-white text-emerald-600 shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileUp size={18} />
            Generate Quiz
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "history"
                ? "bg-white text-emerald-600 shadow-md"
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
          {!quizStarted && questions.length === 0 && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-300 ${
                dragActive
                  ? "border-emerald-500 ring-4 ring-emerald-100"
                  : "border-gray-200 hover:border-emerald-200"
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

                    {/* Number of Questions Input */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Hash size={18} />
                          <span className="text-sm font-medium">Number of questions:</span>
                        </div>
                        <input
                          type="number"
                          min="3"
                          max="20"
                          value={nQuestions}
                          onChange={(e) => setNQuestions(Math.min(20, Math.max(3, parseInt(e.target.value) || 5)))}
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <span className="text-xs text-gray-400">(3-20)</span>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <BrainCircuit size={20} />
                        )}
                        {loading ? "Generating..." : "Generate Quiz"}
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
                          ? "bg-emerald-100 scale-110"
                          : "bg-gradient-to-br from-emerald-50 to-teal-50 group-hover:scale-110"
                      }`}
                    >
                      <Upload
                        size={48}
                        className={`transition-colors ${
                          dragActive
                            ? "text-emerald-600"
                            : "text-emerald-400 group-hover:text-emerald-600"
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
          )}

          {/* --- LOADING STATE --- */}
          {loading && (
            <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-lg shadow-emerald-50 p-16 animate-in fade-in duration-300">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative w-24 h-24">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-emerald-100 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                  <BrainCircuit
                    size={28}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600"
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg text-emerald-600 font-semibold animate-pulse">
                    Generating quiz questions...
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Our AI is creating {nQuestions} questions from your document
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- QUIZ READY TO START --- */}
          {questions.length > 0 && !quizStarted && !loading && (
            <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-lg shadow-emerald-50 p-8 text-center animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BrainCircuit size={40} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Ready!</h3>
              <p className="text-gray-500 mb-6">
                {questions.length} questions generated from {file?.name}
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleClear}
                  className="px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Generate New
                </button>
                <button
                  onClick={startQuiz}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Play size={20} />
                  Start Quiz
                </button>
              </div>
            </div>
          )}

          {/* --- QUIZ IN PROGRESS --- */}
          {quizStarted && !showResults && questions.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-lg overflow-hidden animate-in fade-in duration-300">
              {/* Progress Header */}
              <div className="p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-emerald-700">
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Object.keys(selectedAnswers).length} answered
                  </span>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  {questions[currentQuestion].question}
                </h3>

                {/* Options */}
                <div className="space-y-3">
                  {Object.entries(questions[currentQuestion].options).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => selectAnswer(currentQuestion, key)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${getOptionStyle(
                        currentQuestion,
                        key,
                        questions[currentQuestion].answer
                      )}`}
                    >
                      <span className="font-bold mr-3">{key}.</span>
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="p-6 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestion === 0}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                
                {currentQuestion === questions.length - 1 ? (
                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(selectedAnswers).length < questions.length}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition-all"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}

          {/* --- RESULTS --- */}
          {showResults && (
            <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-lg overflow-hidden animate-in fade-in duration-300">
              {/* Score Header */}
              <div className="p-8 text-center bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-100">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Trophy size={40} className={score >= questions.length / 2 ? "text-yellow-500" : "text-gray-400"} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
                <p className="text-4xl font-bold text-emerald-600">
                  {score} / {questions.length}
                </p>
                <p className="text-gray-500 mt-2">
                  {Math.round((score / questions.length) * 100)}% correct
                </p>
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={retakeQuiz}
                    className="px-5 py-2.5 border border-emerald-200 rounded-xl font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition-all"
                  >
                    <RotateCcw size={18} />
                    Retake Quiz
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition-all"
                  >
                    New Quiz
                  </button>
                </div>
              </div>

              {/* Review Answers */}
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Review Answers</h4>
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={index} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="flex items-start gap-3">
                        {selectedAnswers[index] === q.answer ? (
                          <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{q.question}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Your answer: <span className={selectedAnswers[index] === q.answer ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              {selectedAnswers[index] || "Not answered"}
                            </span>
                            {selectedAnswers[index] !== q.answer && (
                              <span className="text-green-600 font-medium"> • Correct: {q.answer}</span>
                            )}
                          </p>
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
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BrainCircuit size={40} className="text-gray-300" />
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
          <div className="p-5 border-b bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <History size={20} className="text-emerald-600" />
              Quiz History
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              View and retake your previously generated quizzes
            </p>
          </div>

          {historyLoading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
              <span className="text-gray-600 font-medium">Loading history...</span>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <History size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">
                No quizzes yet
              </p>
              <p className="text-gray-500 text-sm max-w-sm">
                Generate a quiz from a PDF document to see your history here.
              </p>
              <button
                onClick={() => setActiveTab("generate")}
                className="mt-6 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all flex items-center gap-2"
              >
                <FileUp size={18} />
                Generate your first quiz
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
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <BrainCircuit size={24} className="text-emerald-500" />
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
                          <span className="text-emerald-600 font-medium">
                            {item.questions?.length || 0} questions
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={item.fileURL}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
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

                  {/* Expanded Quiz */}
                  {expandedItem === index && (
                    <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                        {!historyQuizState[item.id]?.started ? (
                          <div className="text-center py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startHistoryQuiz(item.id, item.questions);
                              }}
                              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 flex items-center gap-2 mx-auto transition-all"
                            >
                              <Play size={18} />
                              Take This Quiz
                            </button>
                          </div>
                        ) : historyQuizState[item.id]?.showResults ? (
                          <div className="text-center py-4">
                            <p className="text-2xl font-bold text-emerald-600 mb-2">
                              {historyQuizState[item.id].score} / {item.questions.length}
                            </p>
                            <p className="text-gray-500 text-sm mb-4">
                              {Math.round((historyQuizState[item.id].score / item.questions.length) * 100)}% correct
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startHistoryQuiz(item.id, item.questions);
                              }}
                              className="px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-medium hover:bg-white transition-all"
                            >
                              Retake Quiz
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="mb-4 flex items-center justify-between">
                              <span className="text-sm font-medium text-emerald-700">
                                Question {(historyQuizState[item.id]?.currentQuestion || 0) + 1} of {item.questions.length}
                              </span>
                            </div>
                            
                            {item.questions && item.questions[historyQuizState[item.id]?.currentQuestion || 0] && (
                              <>
                                <p className="font-medium text-gray-900 mb-4">
                                  {item.questions[historyQuizState[item.id]?.currentQuestion || 0].question}
                                </p>
                                <div className="space-y-2 mb-4">
                                  {Object.entries(item.questions[historyQuizState[item.id]?.currentQuestion || 0].options).map(([key, value]) => (
                                    <button
                                      key={key}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectHistoryAnswer(item.id, historyQuizState[item.id]?.currentQuestion || 0, key);
                                      }}
                                      className={`w-full p-3 rounded-lg border-2 text-left text-sm transition-all ${
                                        historyQuizState[item.id]?.selectedAnswers?.[historyQuizState[item.id]?.currentQuestion || 0] === key
                                          ? "border-emerald-500 bg-white"
                                          : "border-emerald-200 bg-white/50 hover:bg-white"
                                      }`}
                                    >
                                      <span className="font-bold mr-2">{key}.</span>
                                      {value}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex justify-between">
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
                                    className="text-sm text-gray-500 disabled:opacity-50"
                                  >
                                    Previous
                                  </button>
                                  {(historyQuizState[item.id]?.currentQuestion || 0) === item.questions.length - 1 ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        submitHistoryQuiz(item.id);
                                      }}
                                      className="text-sm font-medium text-emerald-600"
                                    >
                                      Submit
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
                                      className="text-sm font-medium text-emerald-600"
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
