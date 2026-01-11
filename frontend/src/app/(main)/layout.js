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
  User,
  Bot,
  ShieldPlus,
  ChevronLeft, // Import Chevron Icons
  ChevronRight
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import { auth } from '@/lib/firebase'; 
import Navbar from '@/components/ui/navbar';

const ADMIN_EMAIL = "me240003034@iiti.ac.in"; 

const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

export default function MainLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname(); 
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- New State for Sidebar Collapse ---
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- 2. Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/'); 
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
    { href: '/doubtsolver', label: 'AI Doubt Solver', icon: Bot },
    { href: '/profile', label: 'My Profile', icon: User },
  ];

  if (user && user.email === ADMIN_EMAIL) {
    navItems.push({ 
      href: '/admin', 
      label: 'Admin Panel', 
      icon: ShieldPlus 
    });
  }

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
        <aside 
          className={`hidden md:flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 z-20 transition-all duration-300 ease-in-out relative
          ${isCollapsed ? 'w-20' : 'w-64'}`}
        >
          {/* Collapse Toggle Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-9 bg-white border border-gray-200 text-gray-500 rounded-full p-1.5 shadow-sm hover:text-indigo-600 hover:border-indigo-100 transition-colors z-50"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Logo Area */}
          <div className={`h-16 flex items-center border-b border-gray-100 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-2xl overflow-hidden whitespace-nowrap">
              <LayoutDashboard className="w-8 h-8 flex-shrink-0" />
              <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Dashboard
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 space-y-2 py-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""} // Tooltip when collapsed
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium whitespace-nowrap
                  ${isCollapsed ? 'justify-center' : ''}
                  ${pathname.startsWith(item.href)
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-gray-200">
            <button 
              title={isCollapsed ? "Settings" : ""}
              className={`flex items-center gap-3 px-3 py-3 text-gray-600 hover:text-gray-900 text-sm font-medium w-full hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Settings className="w-5 h-5 flex-shrink-0" /> 
              {!isCollapsed && "Settings"}
            </button>
            <button 
              onClick={handleSignOut}
              title={isCollapsed ? "Logout" : ""}
              className={`flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 text-sm font-medium w-full rounded-lg transition-colors mt-1 whitespace-nowrap ${isCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" /> 
              {!isCollapsed && "Logout"}
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

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="md:hidden fixed inset-0 bg-black/30 z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              {/* Menu */}
              <div className="md:hidden fixed left-0 right-0 top-16 bg-white border-b border-gray-200 z-50 shadow-lg animate-in slide-in-from-top-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full text-left px-6 py-4 border-b border-gray-50 flex items-center gap-3 transition-colors ${
                      pathname.startsWith(item.href) 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
                {/* Sign Out in mobile menu */}
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left px-6 py-4 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </>
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