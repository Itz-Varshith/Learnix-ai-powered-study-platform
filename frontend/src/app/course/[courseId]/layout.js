'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { 
  Library, MessageSquare, Bot, Layers, FileText, BrainCircuit, ChevronLeft, Loader2 
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // <--- 1. Import Auth
import { auth } from '@/lib/firebase'; 
import Navbar from '@/components/ui/navbar'; 

export default function CourseLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  
  // --- 2. Add User State ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 3. Listen for User (Just like in Main Layout) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/'); // Protect the route
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  // Helper to get the current tool name for the Navbar title
  const getPageTitle = () => {
    const path = pathname.split('/').pop();
    if (path === params.courseId) return "Resources";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const courseId = params.courseId; 
  const baseUrl = `/course/${courseId}`;

  const navItems = [
    { href: `${baseUrl}`, label: 'Resources', icon: Library, exact: true },
    { href: `${baseUrl}/chat`, label: 'Chat Room', icon: MessageSquare },
    { href: `${baseUrl}/doubtsolver`, label: 'AI Doubt Solver', icon: Bot },
    { href: `${baseUrl}/flashcards`, label: 'Flashcards', icon: Layers },
    { href: `${baseUrl}/summarizer`, label: 'Summarizer', icon: FileText },
    { href: `${baseUrl}/quiz`, label: 'Practice Quiz', icon: BrainCircuit },
  ];

  const isActive = (href, exact) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      
      {/* --- Course Sidebar --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 z-20">
        <div className="p-6 border-b">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 text-sm mb-4 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold uppercase">
              {courseId?.substring(0, 2) || 'CS'}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 uppercase leading-tight">{courseId}</h2>
              <p className="text-xs text-gray-500">Course Workspace</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href, item.exact) 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* --- Course Content Area --- */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* --- 4. Pass User to Navbar --- */}
        <Navbar 
          user={user} 
          activeView={getPageTitle()}
          onSignOut={handleSignOut}
        /> 
        
        <div className="p-4 md:p-8 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}