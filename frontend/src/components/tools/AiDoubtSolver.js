"use client";
import { useState, useRef } from "react";
import { Sparkles, Send } from "lucide-react";

export default function AiDoubtSolver() {
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! I am your AI Tutor. Ask me any doubt related to this course.' }
    ]);
    const [input, setInput] = useState("");
    const bottomRef = useRef(null);

    const handleSend = (e) => {
        e.preventDefault();
        if(!input.trim()) return;
        
        const newMsgs = [...messages, { role: 'user', text: input }];
        setMessages(newMsgs);
        setInput("");

        setTimeout(() => {
            setMessages([...newMsgs, { role: 'ai', text: "That's a great question! Here is a simplified explanation..." }]);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 1000);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border shadow-sm animate-in slide-in-from-right-4 duration-300">
            <div className="p-4 border-b bg-indigo-50/50 flex items-center gap-2 rounded-t-xl">
                <Sparkles size={18} className="text-indigo-600" />
                <h3 className="font-bold text-gray-800">AI Tutor</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            m.role === 'user' 
                            ? "bg-indigo-600 text-white rounded-tr-none" 
                            : "bg-gray-100 text-gray-800 rounded-tl-none"
                        }`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef}></div>
            </div>

            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                <input 
                    className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Ask a doubt..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}