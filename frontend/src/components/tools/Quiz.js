"use client";
import { BrainCircuit, ArrowRight } from "lucide-react";

export default function Quiz() {
    return (
        <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-300">
            <div className="bg-white border rounded-2xl p-8 shadow-sm text-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BrainCircuit size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to test your knowledge?</h2>
                <p className="text-gray-500 mb-8">Generate a quick 10-question quiz based on your uploaded resources.</p>
                
                <button className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                    Start Practice Quiz
                </button>
            </div>

            <div className="mt-8">
                <h3 className="font-bold text-gray-900 mb-4">Recent Quizzes</h3>
                <div className="bg-white p-4 rounded-xl border flex justify-between items-center hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center font-bold">
                            A
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">Chapter 1: Basics</p>
                            <p className="text-xs text-gray-500">Score: 8/10 • Yesterday</p>
                        </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-400" />
                </div>
            </div>
        </div>
    );
}