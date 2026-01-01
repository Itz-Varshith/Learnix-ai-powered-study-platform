'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Maximize, Minimize, Settings, X, CheckCircle, Loader2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth'; // Import Auth
import { auth } from '@/lib/firebase'; // Import Firebase Config

const FocusSession = () => {
  // --- Auth State ---
  const [user, setUser] = useState(null);

  // --- Timer State ---
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [customTime, setCustomTime] = useState(25);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // New state to show saving indicator

  const containerRef = useRef(null);
  const API_URL = 'http://localhost:9000/api/focus'; // Backend URL

  // 1. Listen for Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const playSound = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(e => console.log("Audio play failed", e));
  };

  // 2. Save Session to DB
  const saveSessionToDb = async () => {
    if (!user) return; // Don't save if not logged in

    setIsSaving(true);
    try {
      // We save the 'customTime' as duration because that was the target goal
      const duration = mode === 'focus' ? customTime : (customTime || 5); 

      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          duration: duration, 
          mode: mode
        })
      });
      console.log("Session saved successfully!");
    } catch (error) {
      console.error("Failed to save session:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Timer Logic (Updated to call saveSessionToDb)
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer Finished!
      setIsActive(false);
      playSound();
      
      // Only save 'focus' sessions, usually we don't track breaks as productivity
      if (mode === 'focus') {
        saveSessionToDb();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, customTime, user]); // Added dependencies

  // --- Handlers (Same as before) ---
  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? customTime * 60 : 5 * 60);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    const newTime = newMode === 'focus' ? 25 : 5;
    setCustomTime(newTime);
    setTimeLeft(newTime * 60);
  };

  const handleCustomTimeSubmit = (e) => {
    e.preventDefault();
    setIsActive(false);
    setTimeLeft(customTime * 60);
    setIsSettingsOpen(false);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const themes = {
    focus: {
      bg: isFullscreen ? 'bg-indigo-900' : 'bg-white',
      text: isFullscreen ? 'text-white' : 'text-gray-900',
      accent: 'text-indigo-600',
      button: 'bg-indigo-600 hover:bg-indigo-700',
      lightBtn: 'bg-indigo-50 text-indigo-700'
    },
    break: {
      bg: isFullscreen ? 'bg-emerald-900' : 'bg-white',
      text: isFullscreen ? 'text-white' : 'text-gray-900',
      accent: 'text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      lightBtn: 'bg-emerald-50 text-emerald-700'
    }
  };
  const theme = themes[mode];

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-2xl shadow-sm border transition-all duration-500 overflow-hidden flex flex-col items-center justify-center
        ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-full min-h-[500px] border-gray-100'} 
        ${theme.bg}`}
    >
      
      {/* Top Controls */}
      <div className={`absolute top-6 right-6 flex gap-2 ${isFullscreen ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
         {!isFullscreen && (
          <button onClick={() => setIsSettingsOpen(true)} className={`p-2 rounded-full transition-colors ${theme.lightBtn} hover:bg-opacity-80`}>
            <Settings className="w-5 h-5" />
          </button>
         )}
        <button onClick={toggleFullScreen} className={`p-2 rounded-full transition-colors ${theme.lightBtn} hover:bg-opacity-80`}>
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>

      {/* Mode Switcher */}
      {!isFullscreen && (
        <div className="flex bg-gray-100 p-1 rounded-xl mb-10 transition-all">
          <button onClick={() => switchMode('focus')} className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'focus' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            Focus
          </button>
          <button onClick={() => switchMode('break')} className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'break' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
            Break <Coffee className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Timer Display */}
      <div className={`font-mono font-bold tracking-tighter transition-all duration-300 select-none ${isFullscreen ? 'text-[12rem] md:text-[18rem] leading-none text-white opacity-90' : 'text-8xl text-gray-800 mb-10'}`}>
        {formatTime(timeLeft)}
      </div>

      {/* Action Buttons */}
      <div className={`flex items-center gap-6 ${isFullscreen ? 'scale-125 mt-10' : ''}`}>
        <button onClick={toggleTimer} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 ${isActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 ring-4 ring-amber-50' : `${theme.button} text-white ring-4 ring-white/20`}`}>
          {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
        </button>
        
        <button onClick={resetTimer} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isFullscreen ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>
      
      {/* Saving Indicator / Status Text */}
      <div className={`mt-8 h-6 flex items-center justify-center`}>
        {isSaving ? (
          <div className="flex items-center gap-2 text-indigo-500 text-sm font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving Session...
          </div>
        ) : (
          <p className={`text-sm font-medium tracking-wide uppercase ${isFullscreen ? 'text-white/60' : 'text-gray-400'}`}>
            {isActive ? (mode === 'focus' ? "Focusing..." : "Recharging...") : "Ready?"}
          </p>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Timer Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCustomTimeSubmit}>
              <label className="block text-xs font-semibold text-gray-500 mb-2">CUSTOM DURATION (MINS)</label>
              <input autoFocus type="number" min="1" max="120" value={customTime} onChange={(e) => setCustomTime(parseInt(e.target.value) || 0)} className="w-full text-3xl font-bold p-3 border rounded-xl text-center focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 mb-6" />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" /> Set Time
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusSession;