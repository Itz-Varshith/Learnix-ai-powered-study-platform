import React from 'react';
import { Users, MessageSquare, ExternalLink } from 'lucide-react';

const StudyGroups = () => {
  const groups = [
    { id: 1, name: 'Advanced Algorithms', members: 12, topic: 'Computer Science', active: true },
    { id: 2, name: 'Physics Mechanics', members: 8, topic: 'Engineering', active: false },
    { id: 3, name: 'Web Dev Daily', members: 24, topic: 'Development', active: true },
    { id: 4, name: 'Calculus II Prep', members: 5, topic: 'Math', active: true },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Study Groups</h2>
        <button className="text-sm text-indigo-600 font-medium hover:underline">Browse All</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => (
          <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div className="bg-indigo-50 text-indigo-700 p-2 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${group.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {group.active ? 'Active Now' : 'Offline'}
              </span>
            </div>
            
            <h3 className="font-bold text-gray-800 mb-1">{group.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{group.topic} • {group.members} Members</p>
            
            <button className="w-full py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors flex items-center justify-center gap-2">
              Join Session <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyGroups;