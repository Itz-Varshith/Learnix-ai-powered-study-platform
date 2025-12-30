"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"; // To capture the URL ID
import Navbar from "@/components/ui/navbar"; // Reuse your Navbar
import { auth } from "@/lib/firebase";
import { 
  FileText, 
  Download, 
  Upload, 
  MessageSquare, 
  Bell, 
  Send,
  MoreVertical,
  Clock
} from "lucide-react";

export default function CoursePage() {
  const params = useParams(); // Get the dynamic ID (e.g., cs201)
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("resources"); // resources, chat, announcements

  // Mock Course Data (In real app, fetch using params.courseId)
  const courseData = {
    id: params.courseId,
    code: "CS 201",
    name: "Data Structures & Algorithms",
    dept: "CSE",
    description: "Advanced study of linked lists, trees, graphs, and hashing algorithms."
  };

  useEffect(() => {
    // Basic Auth Check
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) router.push("/");
      else setUser(u);
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 1. Top Navbar */}
      <Navbar user={user} activeView={courseData.code} onSignOut={() => auth.signOut()} />

      {/* 2. Page Content */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">
        
        {/* Course Header */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase">
                {courseData.dept}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{courseData.name}</h1>
            </div>
            <p className="text-gray-500 text-sm">{courseData.description}</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <TabButton 
              active={activeTab === "resources"} 
              onClick={() => setActiveTab("resources")} 
              icon={<FileText size={18} />} 
              label="Resources" 
            />
            <TabButton 
              active={activeTab === "announcements"} 
              onClick={() => setActiveTab("announcements")} 
              icon={<Bell size={18} />} 
              label="Notices" 
            />
             <TabButton 
              active={activeTab === "chat"} 
              onClick={() => setActiveTab("chat")} 
              icon={<MessageSquare size={18} />} 
              label="Chat Room" 
            />
          </div>
        </div>

        {/* Dynamic Views */}
        <div className="flex-1 overflow-auto bg-white rounded-xl border shadow-sm relative">
          {activeTab === "resources" && <ResourcesView />}
          {activeTab === "announcements" && <AnnouncementsView />}
          {activeTab === "chat" && <ChatRoomView user={user} />}
        </div>

      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
        active 
          ? "bg-white text-indigo-600 shadow-sm" 
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// 1. RESOURCES VIEW
function ResourcesView() {
  const files = [
    { id: 1, name: "Lecture 1: Introduction to Arrays", type: "PDF", size: "2.4 MB", date: "Oct 10" },
    { id: 2, name: "Assignment 1 Problem Statement", type: "DOCX", size: "1.1 MB", date: "Oct 12" },
    { id: 3, name: "Sorting Algorithms Cheatsheet", type: "PDF", size: "800 KB", date: "Oct 15" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Study Materials</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
          <Upload size={16} /> Upload File
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-900 font-medium border-b">
            <tr>
              <th className="px-6 py-4">File Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Date Added</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  {file.name}
                </td>
                <td className="px-6 py-4">{file.type} • {file.size}</td>
                <td className="px-6 py-4">{file.date}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center gap-1 justify-end ml-auto">
                    <Download size={14} /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 2. ANNOUNCEMENTS VIEW
function AnnouncementsView() {
  const notices = [
    { id: 1, title: "Mid-Sem Exam Schedule", msg: "The mid-sem exam will be held on Nov 15th at 10 AM in Hall B.", date: "2 hours ago", urgent: true },
    { id: 2, title: "Lab Submission Deadline", msg: "Please submit your Lab 3 code by this Friday evening.", date: "Yesterday", urgent: false },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Important Notices</h3>
      <div className="space-y-4">
        {notices.map((notice) => (
          <div key={notice.id} className={`p-5 rounded-lg border ${notice.urgent ? "bg-red-50 border-red-100" : "bg-white border-gray-200"}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className={`font-bold ${notice.urgent ? "text-red-700" : "text-gray-900"}`}>{notice.title}</h4>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} /> {notice.date}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{notice.msg}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. CHAT ROOM VIEW (Placeholder UI)
function ChatRoomView({ user }) {
  const [messages, setMessages] = useState([
    { id: 1, user: "Alex Johnson", text: "Has anyone solved Q3 in the assignment?", time: "10:30 AM", self: false },
    { id: 2, user: "You", text: "Yes, you need to use a Hash Map for that.", time: "10:32 AM", self: true },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), user: "You", text: input, time: "Now", self: true }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.self ? "items-end" : "items-start"}`}>
            <div className={`flex items-end gap-2 max-w-[80%] ${msg.self ? "flex-row-reverse" : "flex-row"}`}>
              {!msg.self && <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">AJ</div>}
              
              <div className={`p-3 rounded-2xl text-sm ${
                msg.self 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-white border text-gray-800 rounded-tl-none shadow-sm"
              }`}>
                {msg.text}
              </div>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-2">{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}