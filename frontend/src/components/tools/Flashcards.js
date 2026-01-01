"use client";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function Flashcards() {
    const [flipped, setFlipped] = useState(null);
    const cards = [
        { id: 1, q: "What is the time complexity of Binary Search?", a: "O(log n)" },
        { id: 2, q: "Define Encapsulation.", a: "Bundling data and methods within one unit." },
        { id: 3, q: "What is a Primary Key?", a: "A unique identifier for a record in a database table." },
    ];

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Flashcards</h2>
                <button className="flex items-center gap-2 text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                    <Plus size={16} /> Create New
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <div 
                        key={card.id}
                        onClick={() => setFlipped(flipped === card.id ? null : card.id)}
                        className="h-48 cursor-pointer perspective-1000 group relative"
                    >
                        <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${flipped === card.id ? "rotate-y-180" : ""}`}>
                            <div className="absolute w-full h-full bg-white border-2 border-indigo-100 rounded-xl p-6 flex items-center justify-center text-center shadow-sm backface-hidden group-hover:border-indigo-300">
                                <p className="font-semibold text-gray-800">{card.q}</p>
                                <span className="absolute bottom-4 text-xs text-gray-400">Click to flip</span>
                            </div>
                            <div className="absolute w-full h-full bg-indigo-600 rounded-xl p-6 flex items-center justify-center text-center shadow-lg rotate-y-180 backface-hidden">
                                <p className="font-bold text-white text-lg">{card.a}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}