'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Plus } from 'lucide-react';

const MyCourses = () => {
  const router = useRouter();

  const courses = [
    { id: 1, tag: 'CSE', code: 'CS 201', title: 'Data Structures', color: 'bg-blue-100 text-blue-700', members: 24 },
    { id: 2, tag: 'MECH', code: 'ME 201', title: 'Thermodynamics', color: 'bg-orange-100 text-orange-700', members: 24 },
    { id: 3, tag: 'CSE', code: 'CS 204', title: 'Computer Architecture', color: 'bg-blue-100 text-blue-700', members: 24 },
    { id: 4, tag: 'BS', code: 'MA 201', title: 'Linear Algebra', color: 'bg-gray-100 text-gray-700', members: 24 }
  ];

  const handleCourseClick = (courseCode) => {
    // Converts "CS 201" -> "cs201" for a cleaner URL
    const formattedId = courseCode.replace(/\s+/g, '').toLowerCase();
    router.push(`/dashboard/course/${formattedId}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 mt-1">Access notes, chats, and resources.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Join Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div 
            key={course.id} 
            // Pass the course.code (e.g., "CS 201") instead of ID
            onClick={() => handleCourseClick(course.code)} 
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[200px]"
          >
            <div className="flex justify-between items-start">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${course.color}`}>
                {course.tag}
              </span>
              <span className="text-xs font-medium text-gray-400">
                {course.code}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {course.title}
              </h3>
            </div>

            <div className="flex justify-between items-end mt-4">
              <div className="flex items-center -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                  +{course.members}
                </div>
              </div>

              <button 
                onClick={(e) => {
                   e.stopPropagation(); 
                   // You can add separate chat routing here later
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 text-sm font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Chat Room
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;