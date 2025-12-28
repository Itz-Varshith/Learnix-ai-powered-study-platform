// src/app/dashboard/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  BookOpen, 
  Search, 
  LogOut, 
  User, 
  Menu,
  Plus 
} from "lucide-react"; 

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-courses"); 
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

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-indigo-600">Learnix</h1>
          <p className="text-xs text-gray-500 mt-1">Study Platform</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab("my-courses")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "my-courses" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BookOpen size={20} />
            My Courses
          </button>
          
          <button 
            onClick={() => setActiveTab("search")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "search" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Search size={20} />
            Search Courses
          </button>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <User size={16} />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.displayName || "Student"}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        
        {activeTab === "my-courses" ? (
          <MyCoursesView />
        ) : (
          <SearchCoursesView />
        )}

      </main>
    </div>
  );
}

function MyCoursesView() {
  const courses = [
    { id: 1, code: "CS 201", name: "Data Structures", dept: "CSE" },
    { id: 2, code: "CS 204", name: "Computer Architecture", dept: "CSE" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
      <p className="text-gray-500 mb-8">Welcome back, continue where you left off.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white p-6 rounded-xl border hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase">
                {course.dept}
              </span>
              <span className="text-gray-400 text-sm">{course.code}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{course.name}</h3>
            <div className="mt-auto pt-4 border-t flex justify-between items-center text-sm text-gray-500">
              <span className="text-indigo-600 font-medium">Open Course →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchCoursesView() {
  const [searchTerm, setSearchTerm] = useState("");

  const allCourses = [
    { id: 1, code: "CS 201", name: "Data Structures", dept: "CSE" },
    { id: 2, code: "CS 204", name: "Computer Architecture", dept: "CSE" },
    { id: 3, code: "MA 201", name: "Linear Algebra", dept: "BS" },
    { id: 4, code: "ME 201", name: "Thermodynamics", dept: "MECH" },
  ];

  const filtered = allCourses.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Courses</h1>
      <p className="text-gray-500 mb-8">Find courses and add them to your dashboard.</p>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Search by course name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <ul className="divide-y divide-gray-100">
          {filtered.map((course) => (
            <li key={course.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                  {course.code.split(" ")[0]}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{course.name}</p>
                  <p className="text-xs text-gray-500">{course.code} • {course.dept}</p>
                </div>
              </div>
              <button 
                onClick={() => alert(`Added ${course.code}`)}
                className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-full hover:bg-indigo-700"
              >
                <Plus size={14} className="mr-1" /> Add
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}