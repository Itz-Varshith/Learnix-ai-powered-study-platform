'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, 
  Plus, 
  Loader2, 
  X, 
  Search, 
  BookOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { auth } from '@/lib/firebase';

const API_BASE = "http://localhost:9000/api/courses";

// Department color mapping
const getDepartmentColor = (department) => {
  const colors = {
    'Computer Science': 'bg-blue-100 text-blue-700',
    'CSE': 'bg-blue-100 text-blue-700',
    'Mechanical': 'bg-orange-100 text-orange-700',
    'MECH': 'bg-orange-100 text-orange-700',
    'Electrical': 'bg-yellow-100 text-yellow-700',
    'EE': 'bg-yellow-100 text-yellow-700',
    'Mathematics': 'bg-purple-100 text-purple-700',
    'MATH': 'bg-purple-100 text-purple-700',
    'Physics': 'bg-green-100 text-green-700',
    'Chemistry': 'bg-pink-100 text-pink-700',
  };
  return colors[department] || 'bg-gray-100 text-gray-700';
};

const MyCourses = () => {
  const router = useRouter();
  
  // State
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [enrollMessage, setEnrollMessage] = useState({ type: '', text: '' });

  // Fetch enrolled courses on mount
  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  // Fetch enrolled courses
  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to view your courses");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/enrolled-courses/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setEnrolledCourses(data.data || []);
      } else {
        setError(data.message || "Failed to fetch courses");
      }
    } catch (err) {
      console.error("Error fetching enrolled courses:", err);
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all available courses
  const fetchAllCourses = async () => {
    try {
      setModalLoading(true);
      setEnrollMessage({ type: '', text: '' });

      const user = auth.currentUser;
      if (!user) {
        setEnrollMessage({ type: 'error', text: "Please sign in first" });
        setModalLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/all-courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setAllCourses(data.data || []);
      } else {
        setEnrollMessage({ type: 'error', text: data.message || "Failed to fetch courses" });
      }
    } catch (err) {
      console.error("Error fetching all courses:", err);
      setEnrollMessage({ type: 'error', text: "Failed to load courses" });
    } finally {
      setModalLoading(false);
    }
  };

  // Enroll in a course
  const handleEnroll = async (courseId) => {
    try {
      setEnrollingCourseId(courseId);
      setEnrollMessage({ type: '', text: '' });

      const user = auth.currentUser;
      if (!user) {
        setEnrollMessage({ type: 'error', text: "Please sign in to enroll" });
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch(`${API_BASE}/enroll/${courseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setEnrollMessage({ type: 'success', text: "Successfully enrolled in course!" });
        // Refresh enrolled courses
        await fetchEnrolledCourses();
        // Close modal after a brief delay
        setTimeout(() => {
          setIsModalOpen(false);
          setEnrollMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setEnrollMessage({ type: 'error', text: data.message || "Failed to enroll" });
      }
    } catch (err) {
      console.error("Error enrolling in course:", err);
      setEnrollMessage({ type: 'error', text: "Failed to enroll. Please try again." });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // Open join course modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setSearchQuery('');
    fetchAllCourses();
  };

  // Navigate to course page
  const handleCourseClick = (courseId) => {
    router.push(`/course/${courseId}`);
  };

  // Filter courses based on search
  const filteredCourses = allCourses.filter(course => {
    const query = searchQuery.toLowerCase();
    return (
      course.courseName?.toLowerCase().includes(query) ||
      course.courseCode?.toLowerCase().includes(query) ||
      course.department?.toLowerCase().includes(query)
    );
  });

  // Check if user is already enrolled in a course
  const isEnrolled = (courseId) => {
    return enrolledCourses.some(enrollment => enrollment.course?.id === courseId || enrollment.courseId === courseId);
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-500 mt-1">Access notes, chats, and resources.</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading your courses...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-500 mt-1">Access notes, chats, and resources.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-gray-700 font-medium mb-2">{error}</p>
          <button
            onClick={fetchEnrolledCourses}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 mt-1">Access notes, chats, and resources.</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Join Course
        </button>
      </div>

      {/* Empty state */}
      {enrolledCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100">
          <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-6">Join a course to get started with your learning journey</p>
          <button 
            onClick={handleOpenModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> Browse Courses
          </button>
        </div>
      ) : (
        /* Course grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((enrollment) => {
            const course = enrollment.course || enrollment;
            return (
              <div 
                key={enrollment.courseId || course.id} 
                onClick={() => handleCourseClick(course.id || enrollment.courseId)} 
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[200px]"
              >
                <div className="flex justify-between items-start">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDepartmentColor(course.department)}`}>
                    {course.department}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    {course.courseCode}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {course.courseName}
                  </h3>
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div className="flex items-center -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      +{course.memberCount || 0}
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      router.push(`/course/${course.id || enrollment.courseId}/chat`);
                    }}
                    className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat Room
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Join a Course</h2>
                <p className="text-gray-500 text-sm mt-1">Browse and enroll in available courses</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses by name, code, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Message */}
            {enrollMessage.text && (
              <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
                enrollMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {enrollMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{enrollMessage.text}</span>
              </div>
            )}

            {/* Course List */}
            <div className="p-4 overflow-y-auto max-h-[400px]">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading courses...</span>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>{searchQuery ? 'No courses match your search' : 'No courses available'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCourses.map((course) => {
                    const enrolled = isEnrolled(course.id);
                    return (
                      <div 
                        key={course.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getDepartmentColor(course.department)}`}>
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{course.courseName}</h3>
                            <p className="text-sm text-gray-500">
                              {course.courseCode} • {course.department}
                            </p>
                          </div>
                        </div>
                        
                        {enrolled ? (
                          <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Enrolled
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrollingCourseId === course.id}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {enrollingCourseId === course.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Enrolling...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Enroll
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
