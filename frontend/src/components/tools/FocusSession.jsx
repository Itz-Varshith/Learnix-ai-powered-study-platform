'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Maximize,
  Minimize,
  Settings,
  X,
  CheckCircle,
  Loader2,
  Clock
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const STORAGE_KEY = 'focus-session-v1';

const FocusSession = () => {
  // --- Auth ---
  const [user, setUser] = useState(null);

  // --- Timer State ---
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [mode, setMode] = useState('focus');
  const [customTime, setCustomTime] = useState(25);

  // --- UI State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef(null);
  const hasProcessedCompletionRef = useRef(false);
  const API_URL = 'http://localhost:9000/api/focus';

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  /* ---------------- SOUND (3 BEEPS, 2s GAP) ---------------- */

  const playSound = () => {
    const url = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const audio = new Audio(url);
        audio.play().catch(() => {});
      }, i * 2000);
    }
  };

  /* ---------------- SAVE SESSION ---------------- */

  const saveSessionToDb = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          duration: customTime,
          mode: 'focus'
        })
      });
    } catch (err) {
      console.error('DB save failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------- HANDLE COMPLETION ---------------- */

  const handleCompletion = async () => {
    if (hasProcessedCompletionRef.current) return;
    hasProcessedCompletionRef.current = true;

    playSound();
    if (mode === 'focus') {
      await saveSessionToDb();
    }
    
    localStorage.removeItem(STORAGE_KEY);
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? customTime * 60 : 5 * 60);
  };

  /* ---------------- RESTORE FROM STORAGE ---------------- */

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const {
        timeLeft: storedTime,
        isActive: storedActive,
        mode: storedMode,
        customTime: storedCustom,
        lastUpdated
      } = JSON.parse(raw);

      let adjusted = storedTime;
      let shouldComplete = false;

      if (storedActive && lastUpdated) {
        const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);

        if (elapsed >= storedTime) {
          adjusted = 0;
          shouldComplete = true;
        } else {
          adjusted = storedTime - elapsed;
        }
      }

      setMode(storedMode);
      setCustomTime(storedCustom);

      if (shouldComplete) {
        // Timer completed while away
        hasProcessedCompletionRef.current = false;
        handleCompletion();
      } else {
        setTimeLeft(adjusted);
        setIsActive(storedActive && adjusted > 0);
      }
    } catch (e) {
      console.error('Restore failed', e);
    }
  }, [user]); // Added user dependency to ensure it's available

  /* ---------------- PERSIST TO STORAGE ---------------- */

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        timeLeft,
        isActive,
        mode,
        customTime,
        lastUpdated: Date.now()
      })
    );
  }, [timeLeft, isActive, mode, customTime]);

  /* ---------------- TIMER ENGINE ---------------- */

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  /* ---------------- TIMER COMPLETION (when on page) ---------------- */

  useEffect(() => {
    if (timeLeft !== 0 || !isActive) return;

    hasProcessedCompletionRef.current = false;
    handleCompletion();
  }, [timeLeft, isActive]);

  /* ---------------- ACTIONS ---------------- */

  const toggleTimer = () => {
    hasProcessedCompletionRef.current = false;
    setIsActive(a => !a);
  };

  const resetTimer = () => {
    hasProcessedCompletionRef.current = false;
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? customTime * 60 : 5 * 60);
  };

  const switchMode = newMode => {
    hasProcessedCompletionRef.current = false;
    setMode(newMode);
    setIsActive(false);
    const mins = newMode === 'focus' ? 25 : 5;
    setCustomTime(mins);
    setTimeLeft(mins * 60);
  };

  const handleCustomTimeSubmit = () => {
    hasProcessedCompletionRef.current = false;
    setIsActive(false);
    setTimeLeft(customTime * 60);
    setIsSettingsOpen(false);
  };

  /* ---------------- FULLSCREEN ---------------- */

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const fs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fs);
    return () => document.removeEventListener('fullscreenchange', fs);
  }, []);

  /* ---------------- HELPERS ---------------- */

  const formatTime = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const getProgress = () => {
    const total = mode === 'focus' ? customTime * 60 : 5 * 60;
    return ((total - timeLeft) / total) * 100;
  };

  const themes = {
    focus: {
      bg: isFullscreen ? 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900' : 'bg-gradient-to-br from-indigo-50 to-white',
      text: isFullscreen ? 'text-white' : 'text-gray-900',
      button: 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl',
      lightBtn: isFullscreen ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
      progress: 'stroke-indigo-600',
      modeBtn: mode === 'focus' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
    },
    break: {
      bg: isFullscreen ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900' : 'bg-gradient-to-br from-emerald-50 to-white',
      text: isFullscreen ? 'text-white' : 'text-gray-900',
      button: 'bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl',
      lightBtn: isFullscreen ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
      progress: 'stroke-emerald-600',
      modeBtn: mode === 'break' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
    }
  };

  const theme = themes[mode];

  /* ---------------- UI ---------------- */

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl shadow-lg border border-gray-200 transition-all overflow-hidden flex flex-col items-center justify-center
        ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-[600px]'}
        ${theme.bg}`}
    >
      {/* Top Controls */}
      <div className="absolute top-6 right-6 flex gap-2">
        {!isFullscreen && (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2.5 rounded-xl transition-all ${theme.lightBtn}`}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        )}
        <button
          onClick={toggleFullScreen}
          className={`p-2.5 rounded-xl transition-all ${theme.lightBtn}`}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* Mode Switcher */}
      {!isFullscreen && (
        <div className="flex bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl mb-12 shadow-md border border-gray-200">
          <button
            onClick={() => switchMode('focus')}
            className={`px-10 py-3 rounded-xl font-bold transition-all text-sm ${
              mode === 'focus' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock size={16} className="inline mr-2" />
            Focus
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`px-10 py-3 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${
              mode === 'break' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Coffee size={16} />
            Break
          </button>
        </div>
      )}

      {/* Timer Circle with Progress */}
      <div className="relative mb-12">
        {/* Progress Circle */}
        <svg className="transform -rotate-90" width="280" height="280">
          <circle
            cx="140"
            cy="140"
            r="130"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className={isFullscreen ? 'text-white/20' : 'text-gray-200'}
          />
          <circle
            cx="140"
            cy="140"
            r="130"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 130}`}
            strokeDashoffset={`${2 * Math.PI * 130 * (1 - getProgress() / 100)}`}
            className={`${isFullscreen ? (mode === 'focus' ? 'text-white' : 'text-white') : theme.progress} transition-all duration-1000`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Timer Display */}
        <div className={`absolute inset-0 flex items-center justify-center ${theme.text}`}>
          <div className="text-center">
            <div className="font-mono font-bold text-7xl tracking-wider">
              {formatTime(timeLeft)}
            </div>
            <div className={`text-sm font-medium mt-2 ${isFullscreen ? 'text-white/70' : 'text-gray-500'}`}>
              {mode === 'focus' ? 'Focus Time' : 'Break Time'}
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 items-center">
        <button
          onClick={toggleTimer}
          className={`w-20 h-20 rounded-2xl text-white flex items-center justify-center transition-all transform hover:scale-105 ${theme.button}`}
        >
          {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
        </button>
        <button
          onClick={resetTimer}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all transform hover:scale-105 ${theme.lightBtn}`}
        >
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Status Text */}
      <div className="mt-8 h-8">
        {isSaving ? (
          <div className={`flex gap-2 text-sm font-medium items-center ${isFullscreen ? 'text-white/80' : 'text-gray-600'}`}>
            <Loader2 size={16} className="animate-spin" /> 
            Saving Session...
          </div>
        ) : (
          <div className={`text-sm font-medium ${isFullscreen ? 'text-white/60' : 'text-gray-400'}`}>
            {isActive ? '🎯 Stay Focused' : '⏸️ Paused'}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Timer Settings</h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={customTime}
                onChange={e => setCustomTime(+e.target.value || 1)}
                className="w-full text-4xl font-mono font-bold text-center border-2 border-gray-200 rounded-xl py-4 mb-6 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              />
              
              <button 
                onClick={handleCustomTimeSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <CheckCircle size={20} />
                Set Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusSession;