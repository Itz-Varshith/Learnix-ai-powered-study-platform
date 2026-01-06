"use client";
import { useState, useEffect, useRef } from "react";
import { Library, Upload, FileText, Image, File, Loader2, X, Download, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase";

const API_BASE = "http://localhost:9000/api/courses";

// File type icon mapping
const getFileIcon = (fileType) => {
  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
  const docTypes = ["pdf", "doc", "docx", "txt", "ppt", "pptx"];
  
  if (imageTypes.includes(fileType)) return <Image size={20} className="text-emerald-500" />;
  if (docTypes.includes(fileType)) return <FileText size={20} className="text-blue-500" />;
  return <File size={20} className="text-gray-500" />;
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function Resources({ courseId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch files on mount
  useEffect(() => {
    if (courseId) {
      fetchFiles();
    }
  }, [courseId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/get-files/${courseId}`);
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.data || []);
      } else {
        setError(data.message || "Failed to fetch files");
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["pdf", "doc", "docx", "ppt", "pptx", "txt", "jpg", "jpeg", "png", "gif"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setError(`File type .${fileExtension} is not supported`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Get auth token
      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to upload files");
        setUploading(false);
        return;
      }

      const token = await user.getIdToken();

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);

      // Simulate progress (since fetch doesn't support progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${API_BASE}/upload-file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        // Add the new file to the list
        setFiles((prev) => [data.data, ...prev]);
        setUploadProgress(0);
      } else {
        setError(data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Materials</h2>
        <div className="bg-white border rounded-xl p-12 shadow-sm flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <span className="ml-3 text-gray-600">Loading files...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Course Materials</h2>
        <button
          onClick={openFileDialog}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload File
            </>
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-red-700 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && uploadProgress > 0 && (
        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-indigo-700 font-medium">Uploading...</span>
            <span className="text-sm text-indigo-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Drop zone / File list */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`bg-white border-2 rounded-xl shadow-sm transition-colors ${
          dragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-200"
        }`}
      >
        {files.length === 0 ? (
          /* Empty state with drop zone */
          <div
            onClick={openFileDialog}
            className="flex flex-col items-center justify-center py-16 text-center cursor-pointer hover:bg-gray-50 transition-colors rounded-xl"
          >
            <div className={`p-4 rounded-full mb-4 ${dragActive ? "bg-indigo-100" : "bg-gray-100"}`}>
              <Library size={48} className={dragActive ? "text-indigo-500" : "text-gray-400"} />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              {dragActive ? "Drop your file here" : "No files uploaded yet"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-xs text-gray-400">
              Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG, GIF (max 10MB)
            </p>
          </div>
        ) : (
          /* File list */
          <div className="divide-y divide-gray-100">
            {/* Drop zone hint when dragging */}
            {dragActive && (
              <div className="p-8 text-center bg-indigo-50 border-b border-indigo-200">
                <Upload className="mx-auto text-indigo-500 mb-2" size={32} />
                <p className="text-indigo-700 font-medium">Drop file to upload</p>
              </div>
            )}
            
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate" title={file.fileName}>
                      {file.fileName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <a
                    href={file.storedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload hint at bottom when files exist */}
      {files.length > 0 && !dragActive && (
        <p className="mt-3 text-center text-sm text-gray-500">
          Drag & drop files anywhere above, or use the Upload button
        </p>
      )}
    </div>
  );
}
