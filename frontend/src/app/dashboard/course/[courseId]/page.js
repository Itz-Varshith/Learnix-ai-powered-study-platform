"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import Navbar from "@/components/ui/navbar"; 
import { 
  Bot, 
  Layers, 
  FileText, 
  BrainCircuit, 
  Library, 
  ChevronLeft,
  MessageSquare // <--- Imported Icon
} from "lucide-react";

// --- Import Tools ---
import Resources from "@/components/tools/Resources";
import AiDoubtSolver from "@/components/tools/AiDoubtSolver";
import Flashcards from "@/components/tools/Flashcards";
import Summarizer from "@/components/tools/Summarizer";
import Quiz from "@/components/tools/Quiz";
import ChatRoom from "@/components/tools/ChatRoom"; // <--- Import New Component

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("resources"); 

  const courseCode = params.courseId ? params.courseId.toUpperCase() : "COURSE";
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) router.push("/");
      else setUser(u);
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) return <div className="h-screen flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm mb-4">
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
              {courseCode.substring(0, 2)}
            </div>
            <div>
                <h2 className="font-bold text-gray-900 leading-tight">{courseCode}</h2>
                <p className="text-xs text-gray-500">Course Tools</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem 
            icon={<Library size={20} />} 
            label="Course Resources" 
            active={activeView === "resources"} 
            onClick={() => setActiveView("resources")}
          />

          {/* Communication Section */}
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Communication
          </div>
          <SidebarItem 
            icon={<MessageSquare size={20} />} 
            label="Chat Room" 
            active={activeView === "chat"} 
            onClick={() => setActiveView("chat")}
          />

          {/* AI Tools Section */}
           <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            AI Study Tools
          </div>
          <SidebarItem 
            icon={<Bot size={20} />} 
            label="AI Doubt Solver" 
            active={activeView === "ai"} 
            onClick={() => setActiveView("ai")}
          />
          <SidebarItem 
            icon={<Layers size={20} />} 
            label="Flashcards" 
            active={activeView === "flashcards"} 
            onClick={() => setActiveView("flashcards")}
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="Summarizer" 
            active={activeView === "summary"} 
            onClick={() => setActiveView("summary")}
          />
          <SidebarItem 
            icon={<BrainCircuit size={20} />} 
            label="Practice Quiz" 
            active={activeView === "quiz"} 
            onClick={() => setActiveView("quiz")}
          />
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 md:ml-64 flex flex-col h-screen">
        <Navbar user={user} activeView={activeView} onSignOut={() => auth.signOut()} />
        
        <main className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          <div className="max-w-5xl mx-auto h-full flex flex-col">
            {activeView === "resources" && <Resources />}
            {activeView === "chat" && <ChatRoom />} {/* <--- Render Component */}
            {activeView === "ai" && <AiDoubtSolver />}
            {activeView === "flashcards" && <Flashcards />}
            {activeView === "summary" && <Summarizer />}
            {activeView === "quiz" && <Quiz />}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        active 
          ? "bg-indigo-50 text-indigo-600 shadow-sm" 
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}