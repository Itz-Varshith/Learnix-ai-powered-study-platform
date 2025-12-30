"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Navbar from "@/components/ui/navbar"; // Importing from your new path
import { 
  BookOpen, 
  Users, 
  CheckSquare, 
  Timer, 
  MessageCircle, 
  Plus
} from "lucide-react"; 

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview"); 
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/"); 
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* --- LEFT SIDEBAR --- */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">L</div>
          <span className="text-xl font-bold text-gray-800">Learnix</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarItem 
            icon={<BookOpen size={20} />} 
            label="My Courses" 
            active={activeView === "overview"} 
            onClick={() => setActiveView("overview")}
          />
          <SidebarItem 
            icon={<CheckSquare size={20} />} 
            label="My Tasks" 
            active={activeView === "tasks"} 
            onClick={() => setActiveView("tasks")}
          />
          <SidebarItem 
            icon={<Timer size={20} />} 
            label="Focus Session" 
            active={activeView === "focus"} 
            onClick={() => setActiveView("focus")}
          />
           <SidebarItem 
            icon={<Users size={20} />} 
            label="Study Groups" 
            active={activeView === "groups"} 
            onClick={() => setActiveView("groups")}
          />
        </nav>

        <div className="p-4 border-t">
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <h4 className="text-sm font-semibold text-indigo-800">Department</h4>
            <p className="text-xs text-indigo-600 mt-1">Computer Science (CSE)</p>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 md:ml-64 flex flex-col h-screen">
        
        {/* --- NAVBAR --- */}
        <Navbar 
          user={user} 
          activeView={activeView} 
          onSignOut={handleSignOut} 
        />

        {/* --- DYNAMIC DASHBOARD CONTENT --- */}
        <main className="p-8 overflow-y-auto flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {activeView === "overview" && <CoursesGrid />}
            {activeView === "tasks" && <TodoView />}
            {activeView === "focus" && <FocusTimerView />}
            {activeView === "groups" && <StudyGroupsView />}
          </div>
        </main>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (Internal to Dashboard for now) ---

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

function CoursesGrid() {
  const router = useRouter();
  
  // Mock Data
  const courses = [
    { id: "cs201", code: "CS 201", name: "Data Structures", dept: "CSE", active: true },
    { id: "me201", code: "ME 201", name: "Thermodynamics", dept: "MECH", active: true },
    { id: "cs204", code: "CS 204", name: "Computer Architecture", dept: "CSE", active: true },
    { id: "ma201", code: "MA 201", name: "Linear Algebra", dept: "BS", active: false },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 text-sm mt-1">Access notes, chats, and resources.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
          <Plus size={16} /> Join Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div 
            key={course.id} 
            onClick={() => router.push(`/dashboard/course/${course.id}`)}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                course.dept === "CSE" ? "bg-blue-100 text-blue-700" :
                course.dept === "MECH" ? "bg-orange-100 text-orange-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {course.dept}
              </span>
              <span className="text-gray-400 text-xs font-mono group-hover:text-indigo-600 transition-colors">
                {course.code}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{course.name}</h3>
            
            <div className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-center text-sm">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white ring-1 ring-gray-100"></div>
                <div className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white ring-1 ring-gray-100"></div>
                <div className="w-7 h-7 rounded-full bg-indigo-50 border-2 border-white ring-1 ring-gray-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">+24</div>
              </div>
              <div className="flex items-center text-gray-400 gap-1.5 group-hover:text-indigo-600 transition-colors text-xs font-medium">
                <MessageCircle size={14} />
                <span>Chat Room</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodoView() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Submit Data Structures Assignment", due: "Today", done: false },
    { id: 2, text: "Revise Thermo Chapter 3", due: "Tomorrow", done: true },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? {...t, done: !t.done} : t));
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-8 animate-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">My Tasks</h2>
      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition group">
            <button 
              onClick={() => toggleTask(task.id)}
              className={`h-5 w-5 rounded border flex items-center justify-center mr-4 transition-colors ${
                task.done ? "bg-indigo-600 border-indigo-600" : "border-gray-300 group-hover:border-indigo-400"
              }`}
            >
              {task.done && <CheckSquare size={14} className="text-white" />}
            </button>
            <div className="flex-1">
              <p className={`text-sm font-medium transition-colors ${task.done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                {task.text}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded font-medium ${
                task.due === "Today" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
            }`}>
                {task.due}
            </span>
          </div>
        ))}
        <button className="w-full py-3 text-sm text-gray-500 border-2 border-dashed rounded-lg hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center gap-2 mt-4">
          <Plus size={16} /> Add New Task
        </button>
      </div>
    </div>
  );
}

function FocusTimerView() {
  return (
    <div className="max-w-2xl mx-auto text-center mt-10 animate-in zoom-in-95 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border p-12">
        <h2 className="text-2xl font-bold text-gray-900">Focus Mode</h2>
        <p className="text-gray-500 mb-10">Start a 25-minute Pomodoro session to stay productive.</p>
        
        <div className="text-7xl font-mono font-bold text-indigo-600 mb-10 tracking-widest">
          25:00
        </div>
        
        <div className="flex justify-center gap-4">
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 active:scale-95 transform duration-150">
            Start Timer
          </button>
          <button className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition active:scale-95 transform duration-150">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function StudyGroupsView() {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Active Study Groups</h2>
            <p className="text-sm text-gray-500">Join a room to discuss and study together.</p>
        </div>
        <button className="text-sm bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium text-gray-700 shadow-sm">
            + Create Group
        </button>
      </div>

      <div className="grid gap-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 flex items-center justify-between hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 ring-4 ring-green-50">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Late Night Coding {i}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">DSA</span>
                    <span>•</span>
                    <span>4 Members</span>
                    <span>•</span>
                    <span className="text-green-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Active now
                    </span>
                </div>
              </div>
            </div>
            <button className="px-5 py-2.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium shadow-sm">
              Join Room
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}