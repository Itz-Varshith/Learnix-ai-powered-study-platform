"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // To redirect non-admins
import {
  Plus,
  BookOpen,
  Hash,
  FileText,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/courses`;

const ADMIN_EMAIL = "me240003034@iiti.ac.in"; 

export default function AdminPage() {
  const router = useRouter();
  
  // Auth state
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false); // Controls visibility
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form state
  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    courseDescription: "",
    department: "",
  });

  // --- 1. Protect the Route ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAuthorized(true); // Allow access
      } else {
        // If not logged in, or not the admin, kick them to dashboard
        router.push("/dashboard"); 
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle course creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/create-course`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: `Course "${formData.courseName}" created successfully!`,
        });
        // Reset form
        setFormData({
          courseCode: "",
          courseName: "",
          courseDescription: "",
          department: "",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to create course",
        });
      }
    } catch (error) {
      console.error("Error creating course:", error);
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // If we are checking auth, show nothing or a spinner
  if (!isAuthorized) return null; 

  // --- Render The Form (No Password Gate needed now) ---
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Plus className="w-6 h-6 text-indigo-600" />
          </div>
          Create New Course
        </h1>
        <p className="text-gray-500 mt-2">
          Administrator Panel: Add new courses to the platform.
        </p>
      </div>

      {/* Success/Error Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            className="ml-auto text-current opacity-60 hover:opacity-100"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Course Details
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Course Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Hash size={16} className="text-gray-400" />
                Course Code
              </span>
            </label>
            <input
              type="text"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              placeholder="e.g., CS101"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
          </div>

          {/* Course Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <BookOpen size={16} className="text-gray-400" />
                Course Name
              </span>
            </label>
            <input
              type="text"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              placeholder="e.g., Introduction to Computer Science"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                Department
              </span>
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., Computer Science"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
          </div>

          {/* Course Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                Course Description
              </span>
            </label>
            <textarea
              name="courseDescription"
              value={formData.courseDescription}
              onChange={handleChange}
              placeholder="Describe the course objectives..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" /> Create Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}