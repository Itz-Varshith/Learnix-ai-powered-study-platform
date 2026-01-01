"use client";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react"; // Removed 'User' if not used, or keep if needed

export default function ChatRoom() { // <--- CRITICAL: Must say 'export default'
  const [messages, setMessages] = useState([
    { id: 1, user: "Alex Johnson", text: "Has anyone solved Q3 in the assignment?", time: "10:30 AM", self: false },
    { id: 2, user: "You", text: "Yes, you need to use a Hash Map for that.", time: "10:32 AM", self: true },
    { id: 3, user: "Sarah Lee", text: "Thanks! That helped a lot.", time: "10:35 AM", self: false },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newMsg = { 
      id: Date.now(), 
      user: "You", 
      text: input, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      self: true 
    };
    
    setMessages([...messages, newMsg]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border shadow-sm animate-in fade-in duration-500 overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-bold text-gray-900">Class Discussion</h2>
        <p className="text-xs text-gray-500">24 Students Online</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.self ? "items-end" : "items-start"}`}>
            <div className={`flex items-end gap-2 max-w-[85%] ${msg.self ? "flex-row-reverse" : "flex-row"}`}>
              {!msg.self && (
                <div className="w-8 h-8 mb-1 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-200 shrink-0">
                  {msg.user.charAt(0)}
                </div>
              )}
              <div className={`p-3.5 rounded-2xl text-sm shadow-sm ${
                msg.self 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
              }`}>
                 {!msg.self && <span className="block text-[10px] font-bold text-gray-500 mb-1">{msg.user}</span>}
                {msg.text}
              </div>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-2">{msg.time}</span>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      <div className="p-4 bg-gray-50 border-t">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition"
            disabled={!input.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}