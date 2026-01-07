'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  UserPlus, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  CheckCircle2,
  X,
  Search,
  Shield,
  Mail
} from 'lucide-react';
import { auth } from '@/lib/firebase';

const API_BASE = "http://localhost:9000/api/courses";

const GroupMembers = ({ groupId }) => {
  // State
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isCurrentUserHead, setIsCurrentUserHead] = useState(false);
  
  // Add head modal state
  const [isAddHeadModalOpen, setIsAddHeadModalOpen] = useState(false);
  const [addingHeadId, setAddingHeadId] = useState(null);
  const [addHeadMessage, setAddHeadMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch members on mount
  useEffect(() => {
    if (groupId) {
      fetchMembers();
    }
  }, [groupId]);

  // Set current user ID
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  // Check if current user is head when members load
  useEffect(() => {
    if (members.length > 0 && currentUserId) {
      const currentUserMember = members.find(m => m.id === currentUserId);
      setIsCurrentUserHead(currentUserMember?.isHead || false);
    }
  }, [members, currentUserId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to view members");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/get-study-group-members/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setMembers(data.data || []);
      } else {
        setError(data.message || "Failed to fetch members");
      }
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Failed to load members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHead = async (memberId) => {
    try {
      setAddingHeadId(memberId);
      setAddHeadMessage({ type: '', text: '' });

      const user = auth.currentUser;
      if (!user) {
        setAddHeadMessage({ type: 'error', text: "Please sign in" });
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/add-study-group-head/${groupId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newHeadId: memberId }),
      });

      const data = await response.json();

      if (data.success) {
        setAddHeadMessage({ type: 'success', text: "New head added successfully!" });
        // Refetch members to update the list
        await fetchMembers();
        setTimeout(() => {
          setIsAddHeadModalOpen(false);
          setAddHeadMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setAddHeadMessage({ type: 'error', text: data.message || "Failed to add head" });
      }
    } catch (err) {
      console.error("Error adding head:", err);
      setAddHeadMessage({ type: 'error', text: "Failed to add head. Please try again." });
    } finally {
      setAddingHeadId(null);
    }
  };

  // Get non-head members for the add head modal
  const nonHeadMembers = members.filter(m => !m.isHead);
  
  // Filter members based on search
  const filteredNonHeadMembers = nonHeadMembers.filter(member => {
    const query = searchQuery.toLowerCase();
    return (
      member.name?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query)
    );
  });

  // Sort members: heads first, then alphabetically
  const sortedMembers = [...members].sort((a, b) => {
    if (a.isHead && !b.isHead) return -1;
    if (!a.isHead && b.isHead) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Generate a consistent color based on name
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ];
    const index = (name || '').charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Loading state
  if (loading) {
    return (
      <div className="animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Group Members</h2>
        <div className="bg-white border rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
          <span className="text-gray-600 font-medium">Loading members...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Group Members</h2>
        <div className="bg-white border rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-gray-700 font-medium mb-2">{error}</p>
          <button
            onClick={fetchMembers}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Group Members</h2>
          <p className="text-gray-500 text-sm mt-1">{members.length} member{members.length !== 1 ? 's' : ''} in this group</p>
        </div>
        {isCurrentUserHead && (
          <button
            onClick={() => {
              setIsAddHeadModalOpen(true);
              setSearchQuery('');
              setAddHeadMessage({ type: '', text: '' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <UserPlus size={16} />
            Add Head
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {/* Heads Section */}
        {members.some(m => m.isHead) && (
          <div className="border-b border-gray-100">
            <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-indigo-50">
              <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                <Crown size={16} />
                Group Heads ({members.filter(m => m.isHead).length})
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {sortedMembers.filter(m => m.isHead).map((member) => (
                <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-purple-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white font-bold text-sm ring-2 ring-purple-400 ring-offset-2`}>
                        {getInitials(member.name)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
                        <Crown size={10} className="text-white fill-white" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                          <Crown size={10} className="fill-white" />
                          Head
                        </span>
                        {member.id === currentUserId && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <Mail size={12} />
                        {member.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Members Section */}
        {members.some(m => !m.isHead) && (
          <div>
            <div className="px-6 py-3 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <Users size={16} />
                Members ({members.filter(m => !m.isHead).length})
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {sortedMembers.filter(m => !m.isHead).map((member) => (
                <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white font-bold text-sm`}>
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center gap-1">
                          <Users size={10} />
                          Member
                        </span>
                        {member.id === currentUserId && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail size={12} />
                        {member.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No members yet</h3>
            <p className="text-gray-500">Be the first to join this group!</p>
          </div>
        )}
      </div>

      {/* Add Head Modal */}
      {isAddHeadModalOpen && (
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
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Add Group Head</h2>
                    <p className="text-purple-100 text-sm">Promote a member to head</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddHeadModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Message */}
            {addHeadMessage.text && (
              <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
                addHeadMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {addHeadMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{addHeadMessage.text}</span>
              </div>
            )}

            {/* Members List */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {filteredNonHeadMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>{searchQuery ? 'No members match your search' : 'No members available to promote'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNonHeadMembers.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white font-bold text-sm`}>
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddHead(member.id)}
                        disabled={addingHeadId === member.id}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {addingHeadId === member.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Crown className="w-4 h-4" />
                            Make Head
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMembers;

