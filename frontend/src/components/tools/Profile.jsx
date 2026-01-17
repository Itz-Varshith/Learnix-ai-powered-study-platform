'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, Clock, CheckCircle, Trophy, Calendar, 
  Loader2, Target, Zap, Flame 
} from 'lucide-react';

// --- Helper: Generate Last 365 Days for Heatmap ---
const getYearlyDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
};

// --- Helper: Format Date for Comparison (YYYY-MM-DD) ---
const formatDateKey = (date) => {
  return date.toISOString().split('T')[0];
};

export default function Profile({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState({ focus: {}, tasks: {} });
  const [heatmapMode, setHeatmapMode] = useState('focus'); // 'focus' or 'tasks'

  // --- 1. Fetch Stats ---
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/${user.uid}`);
        if (!res.ok) throw new Error("Failed to fetch");
        
        const data = await res.json();
        setStats(data);

        // Directly use the full history maps from backend
        setHeatmapData({ 
          focus: data.focusHistory || {}, 
          tasks: data.taskHistory || {} 
        });

      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // --- Safe Defaults ---
  const safeStats = stats || {};
  const minutesFocusedToday = safeStats.minutesFocusedToday || 0;
  const tasksCompletedToday = safeStats.tasksCompletedToday || 0;
  const totalFocusHours = safeStats.totalFocusHours || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* --- 1. Profile Header --- */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row items-center gap-8">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 p-1 shadow-xl">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-indigo-600 uppercase">{user?.displayName?.charAt(0)}</span>
                )}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm" title="Online"></div>
          </div>

          {/* Info */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{user?.displayName}</h1>
            <p className="text-gray-500 font-medium">{user?.email}</p>
            
            
          </div>

          {/* Quick Stat (Right Side) */}
          <div className="hidden md:block text-right">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Productivity Score</p>
            <div className="text-5xl font-black text-indigo-600 tracking-tighter">
              {calculateProductivityScore(stats)}
              <span className="text-2xl text-gray-300">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Based on activity</p>
          </div>
        </div>
      </div>

      {/* --- 2. Key Metrics Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Flame className="w-6 h-6 text-orange-500" />}
          label="Focus Today"
          value={minutesFocusedToday}
          unit="mins"
          progress={(minutesFocusedToday / 120) * 100}
          color="orange"
        />
        <StatCard 
          icon={<CheckCircle className="w-6 h-6 text-emerald-500" />}
          label="Tasks Done today"
          value={tasksCompletedToday}
          unit="tasks"
          color="emerald"
        />
        <StatCard 
          icon={<Trophy className="w-6 h-6 text-amber-500" />}
          label="Quizzes Ace'd"
          value="0"
          unit="quizzes"
          color="amber"
        />
        <StatCard 
          icon={<Clock className="w-6 h-6 text-indigo-500" />}
          label="Lifetime Focus"
          value={totalFocusHours}
          unit="hours"
          subLabel="Total dedication"
          color="indigo"
        />
      </div>

      {/* --- 3. Activity Heatmap Section --- */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-colors ${heatmapMode === 'focus' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {heatmapMode === 'focus' ? <Clock size={22} /> : <CheckCircle size={22} />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {heatmapMode === 'focus' ? 'Focus Activity' : 'Task Completion'}
              </h3>
              <p className="text-sm text-gray-500">Last 52 weeks</p>
            </div>
          </div>

          {/* Toggle Button */}
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setHeatmapMode('focus')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                heatmapMode === 'focus' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock size={16} className="inline mr-1.5" />
              Focus Time
            </button>
            <button
              onClick={() => setHeatmapMode('tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                heatmapMode === 'tasks' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle size={16} className="inline mr-1.5" />
              Tasks
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-gray-500">
            {heatmapMode === 'focus' ? 'Focus minutes per day' : 'Tasks completed per day'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400">Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded bg-gray-100"></div>
              <div className={`w-3 h-3 rounded ${heatmapMode === 'focus' ? 'bg-indigo-200' : 'bg-emerald-200'}`}></div>
              <div className={`w-3 h-3 rounded ${heatmapMode === 'focus' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
              <div className={`w-3 h-3 rounded ${heatmapMode === 'focus' ? 'bg-indigo-600' : 'bg-emerald-600'}`}></div>
              <div className={`w-3 h-3 rounded ${heatmapMode === 'focus' ? 'bg-indigo-800' : 'bg-emerald-800'}`}></div>
            </div>
            <span className="text-xs font-medium text-gray-400">More</span>
          </div>
        </div>
        
        <Heatmap 
          data={heatmapMode === 'focus' ? heatmapData.focus : heatmapData.tasks} 
          type={heatmapMode} 
          colorBase={heatmapMode === 'focus' ? 'bg-indigo' : 'bg-emerald'}
        />
      </div>
    </div>
  );
}

// --- Sub-Components ---

function Badge({ icon, label, color }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${colors[color]}`}>
      {icon} {label}
    </span>
  );
}

function StatCard({ icon, label, value, unit, subLabel, progress, color }) {
  const colors = {
    orange: "text-orange-600 bg-orange-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    indigo: "text-indigo-600 bg-indigo-50",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {progress && (
          <div className="w-12 h-12 relative flex items-center justify-center">
            <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
              <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
              <path className={`${color === 'orange' ? 'text-orange-500' : 'text-indigo-500'}`} strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
            </svg>
          </div>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <h2 className="text-3xl font-bold text-gray-900">{value}</h2>
          <span className="text-sm font-medium text-gray-400">{unit}</span>
        </div>
        <div className="flex justify-between items-end mt-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-xs font-bold text-gray-400">{subLabel}</p>
        </div>
      </div>
    </div>
  );
}

function Heatmap({ data, type, colorBase }) {
  const days = [];
  const today = new Date();
  // Full year: 52 weeks * 7 days = 364 days
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const getColor = (val) => {
    if (!val || val === 0) return "bg-gray-100";
    if (type === 'focus') {
      if (val < 30) return `${colorBase}-200`;
      if (val < 40) return `${colorBase}-400`;
      if (val < 60) return `${colorBase}-600`;
      return `${colorBase}-800`;
    } else {
      if (val < 2) return `${colorBase}-200`;
      if (val < 4) return `${colorBase}-400`;
      if (val < 6) return `${colorBase}-600`;
      return `${colorBase}-800`;
    }
  };

  const monthLabels = [];
  const weeks = [];
  
  // Group days into 52 weeks
  for (let i = 0; i < 52; i++) {
    const weekDays = days.slice(i * 7, (i + 1) * 7);
    weeks.push(weekDays);
    
    // Add month label for first day of each week
    if (weekDays[0]) {
      const monthName = weekDays[0].toLocaleDateString('en-US', { month: 'short' });
      const isNewMonth = i === 0 || weekDays[0].getMonth() !== weeks[i - 1]?.[0]?.getMonth();
      monthLabels.push(isNewMonth ? monthName : '');
    }
  }

  return (
    <div className="space-y-3 w-full">
      {/* Month Labels */}
      <div className="flex gap-[3px]">
        <div className="w-6 flex-shrink-0"></div>
        <div className="flex gap-[3px] flex-1">
          {monthLabels.map((label, idx) => (
            <div key={idx} className="text-[10px] font-medium text-gray-500 flex-1 min-w-[10px]">
              {label && <span className="inline-block">{label}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] justify-around flex-shrink-0 w-6">
          <span className="text-[10px] text-gray-400 font-medium">Mon</span>
          <span className="text-[10px] text-gray-400 font-medium">Wed</span>
          <span className="text-[10px] text-gray-400 font-medium">Fri</span>
        </div>

        {/* Weeks - Full width container */}
        <div className="flex gap-[3px] flex-1 ">
          {weeks.map((weekDays, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px] flex-1 min-w-[10px]">
              {weekDays.map((dateObj, dayIdx) => {
                if (!dateObj) return <div key={dayIdx} className="aspect-square"></div>;
                
                const dateKey = formatDateKey(dateObj);
                const value = data[dateKey] || 0;
                const colorClass = getColor(value);
                
                const tooltip = `${dateObj.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}: ${value} ${type === 'focus' ? 'mins' : 'tasks'}`;

                return (
                  <div 
                    key={dateKey}
                    title={tooltip}
                    className={`aspect-square rounded-sm transition-all hover:ring-2 hover:ring-offset-1 ${
                      type === 'focus' ? 'hover:ring-indigo-400' : 'hover:ring-emerald-400'
                    } cursor-pointer ${colorClass} hover:scale-110`}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-100 mt-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Total</p>
            <p className="text-xl font-bold text-gray-900">
              {Object.values(data).reduce((sum, val) => sum + (val || 0), 0).toLocaleString()}
              <span className="text-sm font-normal text-gray-400 ml-1">
                {type === 'focus' ? 'mins' : 'tasks'}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Average/Day</p>
            <p className="text-xl font-bold text-gray-900">
              {Math.round(Object.values(data).reduce((sum, val) => sum + (val || 0), 0) / 364)}
              <span className="text-sm font-normal text-gray-400 ml-1">
                {type === 'focus' ? 'mins' : 'tasks'}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Best Day</p>
            <p className="text-xl font-bold text-gray-900">
              {Math.max(...Object.values(data), 0)}
              <span className="text-sm font-normal text-gray-400 ml-1">
                {type === 'focus' ? 'mins' : 'tasks'}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Active Days</p>
            <p className="text-xl font-bold text-gray-900">
              {Object.values(data).filter(v => v > 0).length}
              <span className="text-sm font-normal text-gray-400 ml-1">days</span>
            </p>
          </div>
        </div>
        
        <div className="text-left sm:text-right">
          <p className="text-xs text-gray-500 font-medium mb-1">Current Streak</p>
          <p className="text-2xl font-bold text-gray-900">
            {calculateStreak(data)}
            <span className="text-sm font-normal text-gray-400 ml-1">days</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function calculateStreak(data) {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    
    if (data[key] && data[key] > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Calculate Productivity Score (0-100%)
function calculateProductivityScore(stats) {
  if (!stats) return 0;
  
  // Weight different metrics
  const weights = {
    focusGoal: 0.3,      // 30% - Meeting daily focus goals
    taskCompletion: 0.25, // 25% - Task completion
    consistency: 0.25,    // 25% - Consistency (streak)
    totalHours: 0.2       // 20% - Total lifetime hours
  };
  
  // 1. Focus Goal Score (out of 120 mins daily target)
  const focusScore = Math.min((stats.minutesFocusedToday || 0) / 120, 1) * 100;
  
  // 2. Task Completion Score (out of 5 tasks daily target)
  const taskScore = Math.min((stats.tasksCompletedToday || 0) / 5, 1) * 100;
  
  // 3. Consistency Score (based on recent activity)
  // Calculate 7-day streak from focus history
  let recentDays = 0;
  const today = new Date();
  const focusHistory = stats.focusHistory || {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    if (focusHistory[key] && focusHistory[key] > 0) recentDays++;
  }
  const consistencyScore = (recentDays / 7) * 100;
  
  // 4. Total Hours Score (normalize to 100 hours = 100%)
  const totalHoursScore = Math.min((stats.totalFocusHours || 0) / 100, 1) * 100;
  
  // Calculate weighted average
  const finalScore = (
    focusScore * weights.focusGoal +
    taskScore * weights.taskCompletion +
    consistencyScore * weights.consistency +
    totalHoursScore * weights.totalHours
  );
  
  return Math.round(finalScore);
}