"use client";
import { useState, useEffect, useRef } from "react";
import {
  Library,
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  Loader2,
  X,
  Download,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Clock,
  HardDrive,
  User,
} from "lucide-react";
import { auth } from "@/lib/firebase";

const API_BASE = "http://localhost:9000/api/courses";

// Enhanced file type configuration
const fileTypeConfig = {
  // Images
  jpg: {
    icon: ImageIcon,
    color: "emerald",
    label: "Image",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  jpeg: {
    icon: ImageIcon,
    color: "emerald",
    label: "Image",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  png: {
    icon: ImageIcon,
    color: "emerald",
    label: "Image",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  gif: {
    icon: ImageIcon,
    color: "emerald",
    label: "Image",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  webp: {
    icon: ImageIcon,
    color: "emerald",
    label: "Image",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  // Documents
  pdf: {
    icon: FileText,
    color: "red",
    label: "PDF",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
  doc: {
    icon: FileText,
    color: "blue",
    label: "Word",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  docx: {
    icon: FileText,
    color: "blue",
    label: "Word",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  txt: {
    icon: FileCode,
    color: "gray",
    label: "Text",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  // Presentations
  ppt: {
    icon: Presentation,
    color: "orange",
    label: "PPT",
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  pptx: {
    icon: Presentation,
    color: "orange",
    label: "PPT",
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  // Spreadsheets
  xls: {
    icon: FileSpreadsheet,
    color: "green",
    label: "Excel",
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
  },
  xlsx: {
    icon: FileSpreadsheet,
    color: "green",
    label: "Excel",
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
  },
  // Default
  default: {
    icon: File,
    color: "slate",
    label: "File",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
};

const getFileConfig = (fileType) => {
  return fileTypeConfig[fileType?.toLowerCase()] || fileTypeConfig.default;
};

// Check if file is an image
const isImageFile = (fileType) => {
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(
    fileType?.toLowerCase()
  );
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
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export default function Resources({ courseId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (courseId) {
      fetchFiles();
    }
  }, [courseId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to view files");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/get-files/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    const allowedTypes = [
      "pdf",
      "doc",
      "docx",
      "ppt",
      "pptx",
      "txt",
      "jpg",
      "jpeg",
      "png",
      "gif",
    ];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setError(`File type .${fileExtension} is not supported`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to upload files");
        setUploading(false);
        return;
      }

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);

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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();
      if (data.success) {
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
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (file) handleUpload(file);
  };

  const openFileDialog = () => fileInputRef.current?.click();

  // File Card Component
  const FileCard = ({ file }) => {
    const config = getFileConfig(file.fileType);
    const IconComponent = config.icon;
    const isImage = isImageFile(file.fileType);

    return (
      <div
        className={`group relative bg-white rounded-2xl border ${config.border} overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300`}
      >
        {/* Preview Area */}
        <div
          className={`relative h-36 ${config.bg} flex items-center justify-center overflow-hidden`}
        >
          {isImage ? (
            <img
              src={file.storedLink}
              alt={file.fileName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={`${
              isImage ? "hidden" : "flex"
            } flex-col items-center justify-center`}
          >
            <IconComponent
              size={48}
              className={config.text}
              strokeWidth={1.5}
            />
          </div>

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <a
              href={file.storedLink}
              download={file.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white rounded-full text-gray-700 hover:bg-indigo-500 hover:text-white transition-colors shadow-lg"
              title="Download"
            >
              <Download size={18} />
            </a>
          </div>

          {/* File type badge */}
          <span
            className={`absolute top-3 right-3 px-2.5 py-1 ${config.bg} ${config.text} text-xs font-bold rounded-full border ${config.border} shadow-sm`}
          >
            {config.label}
          </span>
        </div>

        {/* Info Area */}
        <div className="p-4">
          <h3
            className="font-semibold text-gray-900 truncate mb-2"
            title={file.fileName}
          >
            {file.fileName}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <HardDrive size={12} />
              {formatFileSize(file.fileSize)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(file.uploadedAt)}
            </span>
          </div>
          {file.uploadedByName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-2 border-t border-gray-100">
              <User size={12} />
              <span className="truncate" title={file.uploadedByName}>
                {file.uploadedByName.length > 20
                  ? file.uploadedByName.substring(0, 20) + "..."
                  : file.uploadedByName}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // List Item Component
  const FileListItem = ({ file }) => {
    const config = getFileConfig(file.fileType);
    const IconComponent = config.icon;

    return (
      <div className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
        {/* Icon */}
        <div className={`p-3 rounded-xl ${config.bg} ${config.text}`}>
          <IconComponent size={24} strokeWidth={1.5} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-gray-900 truncate"
            title={file.fileName}
          >
            {file.fileName}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
            >
              {config.label}
            </span>
            <span>{formatFileSize(file.fileSize)}</span>
            <span>•</span>
            <span>{formatDate(file.uploadedAt)}</span>
            {file.uploadedByName && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-gray-400">
                  <User size={12} />
                  <span
                    className="truncate max-w-[150px]"
                    title={file.uploadedByName}
                  >
                    {file.uploadedByName}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={file.storedLink}
            download={file.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Download"
          >
            <Download size={18} />
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Course Materials
        </h2>
        <div className="bg-white border rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
          <span className="text-gray-600 font-medium">Loading files...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Materials</h2>
          <p className="text-gray-500 text-sm mt-1">
            {files.length} file{files.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          {files.length > 0 && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"
                  />
                </svg>
              </button>
            </div>
          )}

          <button
            onClick={openFileDialog}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload File
              </>
            )}
          </button>
        </div>
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-red-700 text-sm font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && uploadProgress > 0 && (
        <div className="mb-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-indigo-700 font-semibold flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Uploading your file...
            </span>
            <span className="text-sm text-indigo-600 font-bold">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Drop zone / File display */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative transition-all duration-300 ${
          dragActive ? "ring-2 ring-indigo-500 ring-offset-4 rounded-2xl" : ""
        }`}
      >
        {/* Drag overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center border-2 border-dashed border-indigo-500">
            <div className="p-4 bg-indigo-100 rounded-full mb-4 animate-bounce">
              <Upload size={32} className="text-indigo-600" />
            </div>
            <p className="text-indigo-700 font-semibold text-lg">
              Drop your file here
            </p>
            <p className="text-indigo-600 text-sm mt-1">Release to upload</p>
          </div>
        )}

        {files.length === 0 ? (
          /* Empty state */
          <div
            onClick={openFileDialog}
            className="flex flex-col items-center justify-center py-20 text-center cursor-pointer bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:from-indigo-50/30 rounded-2xl transition-all duration-300 group"
          >
            <div className="p-5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
              <Library size={48} className="text-indigo-600" />
            </div>
            <p className="text-xl font-semibold text-gray-800 mb-2">
              No files uploaded yet
            </p>
            <p className="text-gray-500 mb-6 max-w-sm">
              Drag and drop your course materials here, or click to browse your
              files
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {["PDF", "DOC", "PPT", "TXT", "JPG", "PNG"].map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
                >
                  .{type.toLowerCase()}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Maximum file size: 10MB
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid view */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {files.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-3">
            {files.map((file) => (
              <FileListItem key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>

      {/* Upload hint */}
      {files.length > 0 && !dragActive && (
        <p className="mt-6 text-center text-sm text-gray-400">
          💡 Tip: Drag & drop files anywhere on this page to upload
        </p>
      )}
    </div>
  );
}
