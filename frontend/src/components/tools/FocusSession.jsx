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
  Loader2
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
  const API_URL = 'http://localhost:9000/api/focus';

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  /* ---------------- SOUND (3 BEEPS, 2s GAP) ---------------- */

  const playSound = () => {
    const url =
      'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';

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

  /* ---------------- RESTORE FROM STORAGE ---------------- */

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const {
        timeLeft,
        isActive,
        mode,
        customTime,
        lastUpdated
      } = JSON.parse(raw);

      let adjusted = timeLeft;
      let finishedWhileAway = false;

      if (isActive && lastUpdated) {
        const elapsed = Math.floor(
          (Date.now() - lastUpdated) / 1000
        );

        if (elapsed >= timeLeft) {
          adjusted = 0;
          finishedWhileAway = true;
        } else {
          adjusted = timeLeft - elapsed;
        }
      }

      setMode(mode);
      setCustomTime(customTime);
      setIsActive(false);

      if (finishedWhileAway && mode === 'focus') {
        playSound();
        saveSessionToDb();
        localStorage.removeItem(STORAGE_KEY);
        setTimeLeft(25 * 60);
      } else {
        setTimeLeft(adjusted);
        setIsActive(isActive && adjusted > 0);
      }
    } catch (e) {
      console.error('Restore failed', e);
    }
  }, []);

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
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  /* ---------------- TIMER COMPLETION ---------------- */

  useEffect(() => {
    if (timeLeft !== 0 || !isActive) return;

    setIsActive(false);
    playSound();

    if (mode === 'focus') saveSessionToDb();

    localStorage.removeItem(STORAGE_KEY);
    setTimeLeft(25 * 60);
  }, [timeLeft]);

  /* ---------------- ACTIONS ---------------- */

  const toggleTimer = () => setIsActive(a => !a);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? customTime * 60 : 5 * 60);
  };

  const switchMode = newMode => {
    setMode(newMode);
    setIsActive(false);
    const mins = newMode === 'focus' ? 25 : 5;
    setCustomTime(mins);
    setTimeLeft(mins * 60);
  };

  const handleCustomTimeSubmit = e => {
    e.preventDefault();
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
    return () =>
      document.removeEventListener('fullscreenchange', fs);
  }, []);

  /* ---------------- HELPERS ---------------- */

  const formatTime = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(
      s % 60
    ).padStart(2, '0')}`;

  const themes = {
    focus: {
      bg: isFullscreen ? 'bg-indigo-900' : 'bg-white',
      text: isFullscreen ? 'text-white' : 'text-gray-900',
      button: 'bg-indigo-600 hover:bg-indigo-700',
      lightBtn: 'bg-indigo-50 text-indigo-700'
    },
    break: {
      bg: isFullscreen ? 'bg-emerald-900' : 'bg-white',
      text: isFullscreen ? 'text-white' : 'text-gray-900',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      lightBtn: 'bg-emerald-50 text-emerald-700'
    }
  };

  const theme = themes[mode];

  /* ---------------- UI (UNCHANGED) ---------------- */

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl shadow-sm border transition-all overflow-hidden flex flex-col items-center justify-center
        ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-[500px]'}
        ${theme.bg}`}
    >
      {/* Top Controls */}
      <div className="absolute top-6 right-6 flex gap-2">
        {!isFullscreen && (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 rounded-full ${theme.lightBtn}`}
          >
            <Settings />
          </button>
        )}
        <button
          onClick={toggleFullScreen}
          className={`p-2 rounded-full ${theme.lightBtn}`}
        >
          {isFullscreen ? <Minimize /> : <Maximize />}
        </button>
      </div>

      {!isFullscreen && (
        <div className="flex bg-gray-100 p-1 rounded-xl mb-10">
          <button
            onClick={() => switchMode('focus')}
            className="px-8 py-2.5 rounded-lg font-bold"
          >
            Focus
          </button>
          <button
            onClick={() => switchMode('break')}
            className="px-8 py-2.5 rounded-lg flex gap-2"
          >
            Break <Coffee size={16} />
          </button>
        </div>
      )}

      <div className="font-mono font-bold text-8xl mb-10">
        {formatTime(timeLeft)}
      </div>

      <div className="flex gap-6">
        <button
          onClick={toggleTimer}
          className={`w-20 h-20 rounded-full text-white ${theme.button}`}
        >
          {isActive ? <Pause /> : <Play />}
        </button>
        <button
          onClick={resetTimer}
          className="w-14 h-14 rounded-full bg-gray-100"
        >
          <RotateCcw />
        </button>
      </div>

      <div className="mt-8 h-6">
        {isSaving ? (
          <div className="flex gap-2 text-sm">
            <Loader2 className="animate-spin" /> Saving Session...
          </div>
        ) : (
          <span className="text-sm text-gray-400">
            {isActive ? 'Running' : 'Ready'}
          </span>
        )}
      </div>

      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-72">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">Timer Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleCustomTimeSubmit}>
              <input
                type="number"
                min="1"
                max="120"
                value={customTime}
                onChange={e => setCustomTime(+e.target.value || 1)}
                className="w-full text-3xl text-center border rounded mb-4"
              />
              <button className="w-full bg-indigo-600 text-white py-2 rounded">
                <CheckCircle /> Set Time
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusSession;
