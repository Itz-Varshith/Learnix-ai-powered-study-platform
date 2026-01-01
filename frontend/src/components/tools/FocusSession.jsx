import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';

const FocusSession = () => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [mode, setMode] = useState('focus'); // 'focus' or 'break'

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play sound or alert here if needed
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-full min-h-[400px]">
      <div className="mb-8 flex bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => switchMode('focus')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'focus' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Deep Focus
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            mode === 'break' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Short Break <Coffee className="w-4 h-4" />
        </button>
      </div>

      <div className="text-8xl font-bold text-gray-800 tracking-tighter mb-8 font-mono">
        {formatTime(timeLeft)}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTimer}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isActive 
              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200'
          }`}
        >
          {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
        </button>
        
        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
      
      <p className="mt-8 text-gray-400 text-sm">
        {isActive ? "Stay focused on the task at hand." : "Ready to start?"}
      </p>
    </div>
  );
};

export default FocusSession;