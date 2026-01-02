'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Clock, 
  CheckCircle, 
  Trophy, 
  Target, 
  TrendingUp,
  Calendar,
  Loader2
} from 'lucide-react';

const Profile = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch Real Stats from Backend ---
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Pointing to your Stats API
        const res = await fetch(`http://localhost:9000/api/stats/${user.uid}`);
        
        if (!res.ok) {
          console.error("Failed to fetch stats");
          // If failed, we stop loading but stats remains null (handled safely below)
          setLoading(false);
          return;
        }

        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // --- 2. Loading State ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // --- 3. Safe Data Handling (Prevents Crashes) ---
  // If stats is null (api error or new user), use these defaults
  const safeStats = stats || {};

  // Default to 0/empty if specific fields are missing
  const minutesFocusedToday = safeStats.minutesFocusedToday || 0;
  const tasksCompletedToday = safeStats.tasksCompletedToday || 0;
  const totalFocusHours = safeStats.totalFocusHours || 0;
  
  // Ensure weeklyActivity is always an array
  const weeklyActivity = Array.isArray(safeStats.weeklyActivity) ? safeStats.weeklyActivity : [];

  // Calculate Scale for Chart (Avoid divide by zero by defaulting max to 10)
  const maxMinutes = Math.max(...(weeklyActivity.map(d => d.minutes)), 10);
  const focusGoal = 120; // Example daily goal

  // Placeholder for recent activity (Backend doesn't send this yet)
  const recentActivity = [
    { id: 1, type: 'focus', text: 'Completed 25m Focus Session', time: '2 hours ago', icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
    { id: 2, type: 'task', text: 'Finished "Data Structures Assignment"', time: '4 hours ago', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      
      {/* --- User Header --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg uppercase">
          {user?.displayName?.charAt(0) || <User className="w-10 h-10" />}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{user?.displayName || 'Student'}</h1>
          <p className="text-gray-500">{user?.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
             <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 flex items-center gap-1">
               <Target className="w-3 h-3" /> Level 1 Scholar
             </span>
          </div>
        </div>
      </div>

      {/* --- Main Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Focus Time Today */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Clock className="w-5 h-5" /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{minutesFocusedToday}</span>
            <span className="text-sm text-gray-500">/ {focusGoal}m</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Focus Minutes</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-1000" 
              style={{ width: `${Math.min((minutesFocusedToday / focusGoal) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Tasks Completed */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{tasksCompletedToday}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Tasks Completed</p>
        </div>

        {/* Card 3: Quizzes (Placeholder for now) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Trophy className="w-5 h-5" /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All Time</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">0</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Quizzes Taken</p>
        </div>

        {/* Card 4: Total Hours */}
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lifetime</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{totalFocusHours}</span>
            <span className="text-sm text-gray-500">h</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Total Focus Hours</p>
        </div>
      </div>

      {/* --- Charts & History Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Focus Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Weekly Focus Activity</h3>
          
          <div className="flex items-end justify-between h-48 gap-2">
            {weeklyActivity.length > 0 ? (
              weeklyActivity.map((day, index) => {
                const heightPercent = (day.minutes / maxMinutes) * 100;
                return (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                     {/* Tooltip */}
                     <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-8 bg-gray-800 text-white text-xs py-1 px-2 rounded mb-2 z-10">
                        {day.minutes}m
                     </div>
                     {/* Bar */}
                     <div 
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 hover:bg-indigo-500 ${heightPercent > 0 ? 'bg-indigo-600' : 'bg-gray-100'}`}
                      style={{ height: `${heightPercent || 5}%` }} 
                     ></div>
                     {/* Label */}
                     <span className="text-xs font-medium text-gray-500">{day.day}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No activity data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity (Static for now) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.color}`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{activity.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;