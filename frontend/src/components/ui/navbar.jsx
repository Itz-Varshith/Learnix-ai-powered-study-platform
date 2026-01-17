"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link"; 
import { useRouter } from "next/navigation";
import { LogOut, Bell, User, Settings, Menu, ChevronDown, Hexagon } from "lucide-react"; 

export default function Navbar({ user, activeView, onSignOut, toggleSidebar }) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <>
      {/* Google Fonts Import for Special Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
      `}</style>

      <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-sm backdrop-blur-sm bg-opacity-90">
        
        {/* LEFT: Mobile Menu & Brand Logo */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile Toggle */}
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* STYLISH BRAND LOGO with Special Font */}
          <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer select-none">
            <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
               <Hexagon size={22} className="text-white fill-indigo-600" strokeWidth={2.5} />
               <span className="absolute text-white font-bold text-sm">L</span>
            </div>
            <span 
              className="text-2xl font-black text-gray-900 tracking-wider group-hover:text-indigo-600 transition-colors duration-300"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              LEARNIX
            </span>
          </Link>

          {/* Separator & Page Title */}
          <div className="h-6 w-px bg-gray-200 hidden sm:block mx-2"></div>
          
          <h2 className="text-sm font-medium text-gray-500 capitalize hidden sm:block">
           {activeView ? (activeView === "overview" ? "Dashboard" : activeView.replace("-", " ")) : "Dashboard"}
          </h2>
        </div>

        {/* RIGHT: Actions (Notifications & Profile) */}
        <div className="flex items-center gap-3 md:gap-5">
          
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2 rounded-full transition-all duration-200 ${
                isNotifOpen ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                  <span className="text-xs text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium">Mark all read</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 bg-indigo-50/30 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">Assignment Due</h4>
                          <span className="text-[10px] text-gray-500 font-medium bg-white px-1.5 py-0.5 rounded border">1h ago</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">Data Structures Assignment 3 is due tomorrow at 11:59 PM.</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">New Study Material</h4>
                          <span className="text-[10px] text-gray-500 font-medium bg-white px-1.5 py-0.5 rounded border">3h ago</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">New lecture notes uploaded for Machine Learning course.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 group focus:outline-none pl-2 py-1 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-indigo-700 transition-colors">
                  {user.displayName || "Student"}
                </p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{user.email?.split('@')[0]}</p>
              </div>
              
              <div className="relative">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className={`w-9 h-9 rounded-full border-2 object-cover shadow-sm transition-all duration-200 ${
                      isProfileOpen ? "border-indigo-600 ring-2 ring-indigo-100" : "border-white ring-1 ring-gray-200 group-hover:border-indigo-200"
                    }`} 
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-white rounded-full flex items-center justify-center text-indigo-600 border border-gray-200 shadow-sm">
                    <User size={18} />
                  </div>
                )}
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 mr-1 ${isProfileOpen ? "rotate-180 text-indigo-600" : ""}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-gray-50 sm:hidden bg-gray-50">
                    <p className="text-sm font-semibold text-gray-900">{user.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                
                <div className="p-1.5 space-y-0.5">
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push('/profile');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors font-medium"
                  >
                      <User size={16} /> My Profile
                  </button>
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push('/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors font-medium"
                  >
                      <Settings size={16} /> Settings
                  </button>
                </div>
                
                <div className="border-t border-gray-100 p-1.5 mt-1">
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
}