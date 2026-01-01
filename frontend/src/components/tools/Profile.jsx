'use client';

import React from 'react';
import { 
  User, 
  Clock, 
  CheckCircle, 
  Trophy, 
  Target, 
  TrendingUp,
  Calendar
} from 'lucide-react';

const Profile = ({ user }) => {
  // Mock Data - In the future, fetch this from your backend
  const stats = {
    minutesFocusedToday: 45,
    focusGoal: 120,
    tasksCompletedToday: 3,
    tasksTotalToday: 5,
    quizzesTaken: 12,
    totalFocusHours: 128.5,
    streakDays: 5,
    weeklyActivity: [
      { day: 'Mon', minutes: 60 },
      { day: 'Tue', minutes: 45 },
      { day: 'Wed', minutes: 90 },
      { day: 'Thu', minutes: 30 },
      { day: 'Fri', minutes: 120 },
      { day: 'Sat', minutes: 0 },
      { day: 'Sun', minutes: 45 },
    ]
  };

  const recentActivity = [
    { id: 1, type: 'focus', text: 'Completed 25m Focus Session', time: '2 hours ago', icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
    { id: 2, type: 'task', text: 'Finished "Data Structures Assignment"', time: '4 hours ago', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { id: 3, type: 'quiz', text: 'Scored 85% in Thermodynamics Quiz', time: 'Yesterday', icon: Trophy, color: 'text-amber-600 bg-amber-50' },
  ];

  // Helper to calculate bar height percentage for the chart
  const maxMinutes = Math.max(...stats.weeklyActivity.map(d => d.minutes));

  return (
    <div className="space-y-6">
      
      {/* --- User Header --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          {user?.displayName?.charAt(0) || <User className="w-10 h-10" />}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{user?.displayName || 'Student Name'}</h1>
          <p className="text-gray-500">{user?.email || 'student@university.edu'}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
             <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 flex items-center gap-1">
               <Target className="w-3 h-3" /> Level 5 Scholar
             </span>
             <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full border border-orange-100 flex items-center gap-1">
               🔥 {stats.streakDays} Day Streak
             </span>
          </div>
        </div>
      </div>

      {/* --- Main Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Focus Time Today */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{stats.minutesFocusedToday}</span>
            <span className="text-sm text-gray-500">/ {stats.focusGoal}m</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Focus Minutes</p>
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${(stats.minutesFocusedToday / stats.focusGoal) * 100}%` }}></div>
          </div>
        </div>

        {/* Card 2: Tasks Completed */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{stats.tasksCompletedToday}</span>
            <span className="text-sm text-gray-500">/ {stats.tasksTotalToday}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Tasks Done</p>
           {/* Progress Bar */}
           <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(stats.tasksCompletedToday / stats.tasksTotalToday) * 100}%` }}></div>
          </div>
        </div>

        {/* Card 3: Total Quizzes */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All Time</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{stats.quizzesTaken}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Quizzes Taken</p>
          <p className="text-xs text-green-600 mt-3 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Top 10% of class
          </p>
        </div>

         {/* Card 4: Total Hours */}
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lifetime</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{stats.totalFocusHours}</span>
            <span className="text-sm text-gray-500">h</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Total Focus Hours</p>
          <p className="text-xs text-purple-600 mt-3 font-medium flex items-center gap-1">
            Keep it up!
          </p>
        </div>
      </div>

      {/* --- Charts & History Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Focus Chart (Custom CSS Bar Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Weekly Focus Activity</h3>
          
          <div className="flex items-end justify-between h-48 gap-2">
            {stats.weeklyActivity.map((day, index) => {
              const heightPercent = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
              return (
                <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                   {/* Tooltip on Hover */}
                   <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-8 bg-gray-800 text-white text-xs py-1 px-2 rounded mb-2">
                      {day.minutes}m
                   </div>
                   {/* Bar */}
                   <div 
                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out hover:bg-indigo-500 ${index === 4 ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                    style={{ height: `${heightPercent}%` }}
                   ></div>
                   {/* Label */}
                   <span className="text-xs font-medium text-gray-500">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        

      </div>
    </div>
  );
};

export default Profile;