'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ExternalLink, 
  Plus, 
  X, 
  Loader2, 
  Search,
  Globe,
  Lock,
  Hash,
  FileText,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  Mail,
  Check,
  XCircle,
  Clock,
  UserPlus
} from 'lucide-react';
import { auth } from '@/lib/firebase';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/courses`;

const StudyGroups = () => {
  const router = useRouter();
  
  // State for joined groups
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [loadingJoined, setLoadingJoined] = useState(true);
  const [errorJoined, setErrorJoined] = useState(null);
  
  // State for pending invites
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [processingInviteId, setProcessingInviteId] = useState(null);
  
  // State for browse modal
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);
  const [allGroups, setAllGroups] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [browseMessage, setBrowseMessage] = useState({ type: '', text: '' });
  
  // State for create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState({ type: '', text: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    courseDescription: '',
    department: '',
    isInviteOnly: false,
  });

  // Fetch joined study groups and pending invites on mount
  useEffect(() => {
    fetchJoinedStudyGroups();
    fetchPendingInvites();
  }, []);

  const fetchJoinedStudyGroups = async () => {
    try {
      setLoadingJoined(true);
      setErrorJoined(null);

      const user = auth.currentUser;
      if (!user) {
        setErrorJoined("Please sign in to view your study groups");
        setLoadingJoined(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/fetch-joined-study-groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setJoinedGroups(data.data || []);
      } else {
        setErrorJoined(data.message || "Failed to fetch joined groups");
      }
    } catch (err) {
      console.error("Error fetching joined study groups:", err);
      setErrorJoined("Failed to load your study groups. Please try again.");
    } finally {
      setLoadingJoined(false);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      setLoadingInvites(true);

      const user = auth.currentUser;
      if (!user) {
        setLoadingInvites(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/fetch-study-group-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        // Only show pending invites
        const pending = (data.data || []).filter(invite => invite.status === 'Pending');
        setPendingInvites(pending);
      }
    } catch (err) {
      console.error("Error fetching pending invites:", err);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleInviteResponse = async (requestId, status) => {
    try {
      setProcessingInviteId(requestId);

      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/change-status-for-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status, // "Accepted" or "Rejected"
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove the invite from the list
        setPendingInvites(prev => prev.filter(invite => invite.id !== requestId));
        
        // If accepted, refresh joined groups
        if (status === 'Accepted') {
          await fetchJoinedStudyGroups();
        }
      }
    } catch (err) {
      console.error("Error responding to invite:", err);
    } finally {
      setProcessingInviteId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const fetchAllStudyGroups = async () => {
    try {
      setLoadingAll(true);
      setBrowseMessage({ type: '', text: '' });

      const user = auth.currentUser;
      if (!user) {
        setBrowseMessage({ type: 'error', text: "Please sign in first" });
        setLoadingAll(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/fetch-study-groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setAllGroups(data.data || []);
      } else {
        setBrowseMessage({ type: 'error', text: data.message || "Failed to fetch study groups" });
      }
    } catch (err) {
      console.error("Error fetching all study groups:", err);
      setBrowseMessage({ type: 'error', text: "Failed to load study groups" });
    } finally {
      setLoadingAll(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      setJoiningGroupId(groupId);
      setBrowseMessage({ type: '', text: '' });

      const user = auth.currentUser;
      if (!user) {
        setBrowseMessage({ type: 'error', text: "Please sign in to join" });
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/enroll/${groupId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setBrowseMessage({ type: 'success', text: "Successfully joined the study group!" });
        await fetchJoinedStudyGroups();
        setTimeout(() => {
          setIsBrowseModalOpen(false);
          setBrowseMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setBrowseMessage({ type: 'error', text: data.message || "Failed to join" });
      }
    } catch (err) {
      console.error("Error joining study group:", err);
      setBrowseMessage({ type: 'error', text: "Failed to join. Please try again." });
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMessage({ type: '', text: '' });

    try {
      const user = auth.currentUser;
      if (!user) {
        setCreateMessage({ type: 'error', text: "Please sign in to create a study group" });
        setCreating(false);
        return;
      }

      const token = await user.getIdToken();
      
      const requestBody = {
        courseName: formData.courseName,
        courseCode: formData.courseCode,
        courseDescription: formData.courseDescription,
        department: formData.department,
        courseCategory: formData.isInviteOnly ? 'Invite_Only' : 'Open',
        type: 'Study_Group',
      };

      const response = await fetch(`${API_BASE}/create-course`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setCreateMessage({ type: 'success', text: `Study group "${formData.courseName}" created successfully!` });
        setFormData({
          courseName: '',
          courseCode: '',
          courseDescription: '',
          department: '',
          isInviteOnly: false,
        });
        await fetchJoinedStudyGroups();
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setCreateMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setCreateMessage({ type: 'error', text: data.message || "Failed to create study group" });
      }
    } catch (err) {
      console.error("Error creating study group:", err);
      setCreateMessage({ type: 'error', text: "Failed to create study group. Please try again." });
    } finally {
      setCreating(false);
    }
  };

  const openBrowseModal = () => {
    setIsBrowseModalOpen(true);
    setSearchQuery('');
    setBrowseMessage({ type: '', text: '' });
    fetchAllStudyGroups();
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setCreateMessage({ type: '', text: '' });
    setFormData({
      courseName: '',
      courseCode: '',
      courseDescription: '',
      department: '',
      isInviteOnly: false,
    });
  };

  const handleGroupClick = (groupId) => {
    router.push(`/groups/${groupId}`);
  };

  // Check if user is already in a group
  const isJoined = (groupId) => {
    return joinedGroups.some(enrollment => enrollment.course?.id === groupId || enrollment.courseId === groupId);
  };

  // Filter groups based on search
  const filteredGroups = allGroups.filter(group => {
    const query = searchQuery.toLowerCase();
    return (
      group.courseName?.toLowerCase().includes(query) ||
      group.courseCode?.toLowerCase().includes(query) ||
      group.department?.toLowerCase().includes(query)
    );
  });

  // Loading state
  if (loadingJoined) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">My Study Groups</h2>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading your study groups...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (errorJoined) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">My Study Groups</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-gray-700 font-medium mb-2">{errorJoined}</p>
          <button
            onClick={fetchJoinedStudyGroups}
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">My Study Groups</h2>
          <p className="text-gray-500 text-sm mt-1">Collaborate with your peers</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={openBrowseModal}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Search size={16} />
            Browse All
          </button>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Create Group
          </button>
        </div>
      </div>

      {/* Pending Invites Section */}
      {!loadingInvites && pendingInvites.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Mail className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Pending Invites</h3>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
              {pendingInvites.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div 
                key={invite.id}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Invite Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <UserPlus className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-gray-900">
                        {invite.senderName}
                      </span>
                      <span className="text-gray-500 text-sm">invited you to join</span>
                    </div>
                    
                    <div className="bg-white/60 rounded-lg p-3 mb-3">
                      <h4 className="font-bold text-gray-900 text-lg">{invite.studyGroupName}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Hash size={12} />
                        {invite.studyGroupCode}
                      </p>
                    </div>
                    
                    {invite.message && (
                      <div className="bg-white/40 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-600 italic">"{invite.message}"</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>Received {formatDate(invite.createdAt)}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleInviteResponse(invite.id, 'Accepted')}
                      disabled={processingInviteId === invite.id}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingInviteId === invite.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleInviteResponse(invite.id, 'Rejected')}
                      disabled={processingInviteId === invite.id}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingInviteId === invite.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {joinedGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-xl">
          <Users className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No study groups yet</h3>
          <p className="text-gray-500 mb-6">Join or create a study group to get started!</p>
          <div className="flex gap-3">
            <button 
              onClick={openBrowseModal}
              className="px-5 py-2.5 border border-indigo-600 text-indigo-600 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-50 transition-colors"
            >
              <Search size={16} />
              Browse Groups
            </button>
            <button 
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Create Group
            </button>
          </div>
        </div>
      ) : (
        /* Joined Groups grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {joinedGroups.map((enrollment) => {
            const group = enrollment.course || enrollment;
            return (
              <div 
                key={enrollment.courseId || group.id}
                onClick={() => handleGroupClick(group.id || enrollment.courseId)}
                className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group bg-gradient-to-br from-white to-gray-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-purple-100 text-purple-700 p-2.5 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    group.courseCategory === 'Open' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {group.courseCategory === 'Open' ? 'Open' : 'Invite Only'}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-indigo-600 transition-colors">
                  {group.courseName}
                </h3>
                <p className="text-sm text-gray-500 mb-1">{group.courseCode}</p>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.courseDescription}</p>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Users size={12} />
                    {group.memberCount || 0} Members
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {group.department}
                  </span>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/groups/${group.id || enrollment.courseId}/chat`);
                    }}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={14} />
                    Chat
                  </button>
                  <button className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                    Open <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Browse All Modal */}
      {isBrowseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Browse Study Groups</h2>
                <p className="text-gray-500 text-sm mt-1">Find and join study groups</p>
              </div>
              <button 
                onClick={() => setIsBrowseModalOpen(false)}
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
                  placeholder="Search by name, code, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Message */}
            {browseMessage.text && (
              <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
                browseMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {browseMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{browseMessage.text}</span>
              </div>
            )}

            {/* Groups List */}
            <div className="p-4 overflow-y-auto max-h-[400px]">
              {loadingAll ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading study groups...</span>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>{searchQuery ? 'No groups match your search' : 'No open study groups available'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGroups.map((group) => {
                    const joined = isJoined(group.id);
                    return (
                      <div 
                        key={group.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{group.courseName}</h3>
                            <p className="text-sm text-gray-500">
                              {group.courseCode} • {group.department} • {group.memberCount} members
                            </p>
                          </div>
                        </div>
                        
                        {joined ? (
                          <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Joined
                          </span>
                        ) : (
                          <button
                            onClick={() => handleJoinGroup(group.id)}
                            disabled={joiningGroupId === group.id}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {joiningGroupId === group.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Joining...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Join
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

      {/* Create Study Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Create Study Group</h2>
                    <p className="text-purple-100 text-sm">Start collaborating with peers</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message */}
            {createMessage.text && (
              <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
                createMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {createMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{createMessage.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateGroup} className="p-6 space-y-5">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <BookOpen size={14} className="text-gray-400" />
                    Group Name
                  </span>
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  placeholder="e.g., Advanced Algorithms Study Circle"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Group Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Hash size={14} className="text-gray-400" />
                    Group Code
                  </span>
                </label>
                <input
                  type="text"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleInputChange}
                  placeholder="e.g., SG-ALGO-001"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Topic/Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-400" />
                    Topic / Subject
                  </span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science, Physics, Mathematics"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="courseDescription"
                  value={formData.courseDescription}
                  onChange={handleInputChange}
                  placeholder="Describe what your study group is about..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  required
                />
              </div>

              {/* Visibility Toggle */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Group Visibility
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isInviteOnly: false }))}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      !formData.isInviteOnly 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Globe className={`w-6 h-6 mx-auto mb-2 ${!formData.isInviteOnly ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <p className={`font-semibold text-sm ${!formData.isInviteOnly ? 'text-indigo-700' : 'text-gray-700'}`}>Open</p>
                    <p className="text-xs text-gray-500 mt-1">Anyone can join</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isInviteOnly: true }))}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      formData.isInviteOnly 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Lock className={`w-6 h-6 mx-auto mb-2 ${formData.isInviteOnly ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <p className={`font-semibold text-sm ${formData.isInviteOnly ? 'text-indigo-700' : 'text-gray-700'}`}>Invite Only</p>
                    <p className="text-xs text-gray-500 mt-1">Approval required</p>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Study Group
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroups;
