'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut,
  Loader2,
  User 
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import { auth } from '@/lib/firebase'; 
import Navbar from '@/components/ui/navbar';

// --- 1. User Context (Allows pages to access user data) ---
const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

export default function MainLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname(); // Highlights the active sidebar link
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- 2. Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/'); // Redirect to login if not authenticated
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  // --- 3. Navigation Config ---
  const navItems = [
    { href: '/dashboard', label: 'My Courses', icon: BookOpen },
    { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
    { href: '/focus', label: 'Focus Session', icon: Timer },
    { href: '/groups', label: 'Study Groups', icon: Users },
    { href: '/profile', label: 'My Profile', icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <UserContext.Provider value={user}>
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
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  pathname.startsWith(item.href)
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 text-sm font-medium w-full hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="w-5 h-5" /> Settings
            </button>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-medium w-full rounded-lg transition-colors mt-1"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </aside>

        {/* --- Main Content Shell --- */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          <Navbar 
            user={user}
            toggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onSignOut={handleSignOut}
          />

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-gray-200 absolute w-full top-16 z-10 shadow-lg animate-in slide-in-from-top-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full text-left px-6 py-4 border-b border-gray-50 flex items-center gap-3 ${
                    pathname.startsWith(item.href) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </UserContext.Provider>
  );
}