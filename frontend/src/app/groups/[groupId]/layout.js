'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { 
  Library, MessageSquare, ChevronLeft, Loader2, Users, UsersRound, LogOut 
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase'; 
import Navbar from '@/components/ui/navbar'; 

const API_BASE = "http://localhost:9000/api/courses";

export default function GroupLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupDetails, setGroupDetails] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Listen for User
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

  // Fetch group details
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_BASE}/fetch-study-groups`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          const group = data.data.find(g => g.id === params.groupId);
          if (group) {
            setGroupDetails(group);
          }
        }
      } catch (err) {
        console.error("Error fetching group details:", err);
      }
    };

    if (params.groupId && user) {
      fetchGroupDetails();
    }
  }, [params.groupId, user]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  // Helper to get the current tool name for the Navbar title
  const getPageTitle = () => {
    const path = pathname.split('/').pop();
    if (path === params.groupId) return "Resources";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const groupId = params.groupId; 
  const baseUrl = `/groups/${groupId}`;

  const navItems = [
    { href: `${baseUrl}`, label: 'Resources', icon: Library, exact: true },
    { href: `${baseUrl}/chat`, label: 'Chat Room', icon: MessageSquare },
    { href: `${baseUrl}/members`, label: 'Members', icon: UsersRound },
  ];

  const isActive = (href, exact) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      
      {/* --- Group Sidebar --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 z-20">
        <div className="p-6 border-b">
          <button 
            onClick={() => router.push('/groups')} 
            className="flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-4 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Study Groups
          </button>
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight line-clamp-2">
                {groupDetails?.courseName || 'Loading...'}
              </h2>
              <p className="text-xs text-gray-500">
                {groupDetails?.courseCode || 'Study Group'}
              </p>
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
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* --- Group Content Area --- */}
      <main className="flex-1 flex flex-col min-w-0">
        
        <Navbar 
          user={user} 
          activeView={getPageTitle()}
          onSignOut={handleSignOut}
          toggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
              {/* Back to Study Groups */}
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/groups');
                }}
                className="w-full text-left px-6 py-4 border-b border-gray-100 flex items-center gap-3 text-gray-500 hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Study Groups
              </button>
              {/* Group Name Header */}
              <div className="px-6 py-3 bg-purple-50 border-b border-purple-100">
                <p className="font-semibold text-purple-700 text-sm">{groupDetails?.courseName || 'Study Group'}</p>
                <p className="text-xs text-purple-500">{groupDetails?.courseCode}</p>
              </div>
              {/* Nav Items */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full text-left px-6 py-4 border-b border-gray-50 flex items-center gap-3 transition-colors ${
                    isActive(item.href, item.exact) 
                      ? 'bg-purple-50 text-purple-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              {/* Sign Out */}
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
        
        <div className="p-4 md:p-8 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

