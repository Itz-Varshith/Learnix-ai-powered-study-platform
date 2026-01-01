'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut,
  Loader2 // Added spinner for loading state
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Import Firebase Auth methods
import { auth } from '@/lib/firebase'; // Import your firebase config

// Import your components
import FocusSession from '@/components/tools/FocusSession';
import TodoList from '@/components/tools/TodoList';
import StudyGroups from '@/components/tools/StudyGroups';
import MyCourses from '@/components/tools/MyCourses';
import Navbar from '@/components/ui/navbar';

const Dashboard = () => {
  const router = useRouter();
  
  // State for User and Loading
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for UI
  const [activeTab, setActiveTab] = useState('courses');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- 1. Listen for Real Firebase User ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Optional: Redirect to login if not authenticated
        router.push('/'); 
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // --- 2. Handle Real Sign Out ---
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Navigation Items Configuration
  const navItems = [
    { id: 'courses', label: 'My Courses', icon: BookOpen, component: <MyCourses /> },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare, component: <TodoList /> },
    { id: 'focus', label: 'Focus Session', icon: Timer, component: <FocusSession /> },
    { id: 'groups', label: 'Study Groups', icon: Users, component: <StudyGroups /> },
  ];

  const ActiveComponent = navItems.find(item => item.id === activeTab)?.component;

  // Show Loading Spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      
      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-2xl">
            <LayoutDashboard className="w-8 h-8" />
            <span>Dash.</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 text-sm font-medium w-full hover:bg-gray-50 rounded-lg transition-colors">
            <Settings className="w-5 h-5" /> Settings
          </button>
          
          {/* Logout Button in Sidebar */}
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-medium w-full rounded-lg transition-colors mt-1"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* --- 3. Navbar Component with Real User --- */}
        <Navbar 
          user={user}
          activeView={activeTab}
          toggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onSignOut={handleSignOut}
        />

        {/* Mobile Menu Dropdown (Controlled by Navbar toggle) */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 absolute w-full top-16 z-10 shadow-lg animate-in slide-in-from-top-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-6 py-4 border-b border-gray-50 flex items-center gap-3 ${
                  activeTab === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            <div className="transition-all duration-300 ease-in-out">
              {ActiveComponent}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;