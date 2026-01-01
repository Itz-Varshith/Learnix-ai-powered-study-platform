"use client";
import { Library } from "lucide-react";

export default function Resources() {
  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Materials</h2>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <Library size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">No files uploaded yet.</p>
            <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
                Upload Syllabus
            </button>
        </div>
      </div>
    </div>
  );
}