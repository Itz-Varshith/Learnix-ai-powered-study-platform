"use client";
import { useState } from "react";
import { Sparkles, FileText, Copy, Trash2, Check } from "lucide-react";

export default function Summarizer() {
    const [text, setText] = useState("");
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSummarize = () => {
        if(!text.trim()) return;
        setLoading(true);
        // Simulate AI delay
        setTimeout(() => {
            setSummary("This is a simulated AI summary. The algorithm has condensed your text into key points, highlighting the main arguments while removing redundant information to save you time.");
            setLoading(false);
        }, 1500);
    };

    const handleCopy = () => {
        if (!summary) return;
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setText("");
        setSummary("");
    };

    return (
        <div className="w-full mx-auto animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-full mb-4 ring-4 ring-indigo-50">
                    <Sparkles size={24} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">AI Content Summarizer</h2>
                <p className="text-gray-500 mt-2 max-w-lg mx-auto">
                    Transform long lecture notes, articles, or paragraphs into concise, easy-to-read summaries in seconds.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 items-start">
                
                {/* --- INPUT SECTION --- */}
                <div className="flex flex-col h-[550px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-indigo-200 transition-colors">
                    <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Input Text</span>
                        {text && (
                            <button 
                                onClick={handleClear} 
                                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
                            >
                                <Trash2 size={12} /> Clear
                            </button>
                        )}
                    </div>
                    
                    <textarea 
                        className="flex-1 w-full p-5 resize-none focus:outline-none text-gray-700 text-sm leading-relaxed placeholder-gray-400"
                        placeholder="Paste your lecture notes or text here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        spellCheck="false"
                    />

                    <div className="p-4 border-t bg-gray-50/30 flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">{text.length} characters</span>
                        <button 
                            onClick={handleSummarize}
                            disabled={loading || !text.trim()}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                            {loading ? <Sparkles className="animate-spin" size={16}/> : <Sparkles size={16} />}
                            {loading ? "Processing..." : "Summarize Now"}
                        </button>
                    </div>
                </div>

                {/* --- OUTPUT SECTION --- */}
                <div className={`flex flex-col h-[550px] rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    summary ? "bg-white border-indigo-100 shadow-indigo-50" : "bg-gray-50 border-dashed border-gray-300"
                }`}>
                    <div className={`p-4 border-b flex justify-between items-center ${summary ? "bg-indigo-50/50 border-indigo-100" : "border-gray-200"}`}>
                        <span className={`text-xs font-bold uppercase tracking-wider ${summary ? "text-indigo-700" : "text-gray-400"}`}>
                            Generated Summary
                        </span>
                        
                        {summary && (
                            <button 
                                onClick={handleCopy}
                                className="text-gray-500 hover:text-indigo-600 transition-colors p-1.5 rounded-md hover:bg-white"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check size={16} className="text-green-600"/> : <Copy size={16} />}
                            </button>
                        )}
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <div className="relative w-16 h-16">
                                    <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-100 rounded-full"></div>
                                    <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-sm text-indigo-600 font-medium animate-pulse">Analyzing text...</p>
                            </div>
                        ) : summary ? (
                            <div className="prose prose-sm max-w-none text-gray-700 leading-7 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <p>{summary}</p>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <FileText size={32} className="text-gray-300" />
                                </div>
                                <p className="text-sm font-medium">Your summary will appear here</p>
                                <p className="text-xs text-gray-400 mt-1">Paste text on the left to get started</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}