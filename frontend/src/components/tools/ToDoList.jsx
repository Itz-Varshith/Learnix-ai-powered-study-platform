'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Check, Calendar, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';

const TodoList = () => {
  // State
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');

  // POINTING TO YOUR NEW MODULAR BACKEND PORT
  const API_URL = 'http://localhost:9000/api/todos';

  // --- 1. Fetch Logic ---
  const fetchTodos = async (uid) => {
    try {
      const response = await fetch(`${API_URL}/${uid}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchTodos(currentUser.uid);
      } else {
        setUser(null);
        setTodos([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 3. Add Task Logic ---
  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !user) return;

    // Optimistic UI: Show task immediately before server confirms
    const tempId = Date.now().toString();
    const optimisticTodo = {
      id: tempId,
      text: newTask,
      priority,
      deadline,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    setTodos([optimisticTodo, ...todos]);
    setIsModalOpen(false); 
    
    // Reset Form
    setNewTask('');
    setPriority('Medium');
    setDeadline('');

    try {
      // Send to Backend
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          text: optimisticTodo.text,
          priority,
          deadline
        })
      });
      
      if (!res.ok) throw new Error("Failed to save");

      const savedTodo = await res.json();
      // Replace temporary item with real one from database
      setTodos((prev) => prev.map(t => t.id === tempId ? savedTodo : t));

    } catch (error) {
      console.error("Error saving task:", error);
      // Rollback optimistic update if failed
      setTodos((prev) => prev.filter(t => t.id !== tempId));
      alert("Failed to save task. Please try again.");
    }
  };

  // --- 4. Toggle Complete Logic ---
  const toggleComplete = async (todo) => {
    // Immediate UI update
    const updatedStatus = !todo.completed;
    setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: updatedStatus } : t));

    try {
      const res = await fetch(`${API_URL}/${user.uid}/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: updatedStatus })
      });
      if (!res.ok) throw new Error("Failed to update");

    } catch (error) {
      console.error("Error updating status:", error);
      // Revert UI on error
      setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !updatedStatus } : t));
    }
  };

  // --- 5. Remove Task Logic ---
  const removeTodo = async (id) => {
    // Immediate UI update
    const previousTodos = [...todos];
    setTodos(todos.filter(t => t.id !== id));

    try {
      const res = await fetch(`${API_URL}/${user.uid}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to delete");

    } catch (error) {
      console.error("Error deleting task:", error);
      setTodos(previousTodos); // Revert if failed
      alert("Could not delete task.");
    }
  };

  // --- Sorting & Styling ---
  const priorityWeight = { High: 3, Medium: 2, Low: 1 };
  
  const sortedTodos = [...todos].sort((a, b) => {
    // 1. Completed items go to bottom
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    // 2. High priority goes to top
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  const getPriorityColor = (p) => {
    if (p === 'High') return 'bg-red-50 text-red-700 border-red-200';
    if (p === 'Medium') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-green-50 text-green-700 border-green-200';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full relative flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-xl font-bold text-gray-800">My Tasks</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full transition-colors shadow-md flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* List Area */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : sortedTodos.length === 0 ? (
          <div className="text-center text-gray-400 py-10 flex flex-col items-center gap-2">
            <AlertCircle className="w-10 h-10 opacity-20" />
            <p>No tasks yet. Enjoy your day!</p>
          </div>
        ) : (
          sortedTodos.map(todo => (
            <div 
              key={todo.id} 
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                todo.completed 
                  ? 'bg-gray-50 border-gray-100 opacity-60' 
                  : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleComplete(todo)} 
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    todo.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 hover:border-indigo-500 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>

                <div>
                  <p className={`font-medium text-sm transition-all ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {todo.text}
                  </p>
                  
                  <div className="flex gap-2 text-xs mt-1.5">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide ${getPriorityColor(todo.priority)}`}>
                      {todo.priority.toUpperCase()}
                    </span>
                    {todo.deadline && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <Calendar className="w-3 h-3" /> 
                        {new Date(todo.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => removeTodo(todo.id)} 
                className="text-gray-300 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Add New Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addTodo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TASK NAME</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  placeholder="What needs to be done?"
                  value={newTask} onChange={e => setNewTask(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">PRIORITY</label>
                  <select 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={priority} onChange={e => setPriority(e.target.value)}
                  >
                    <option value="High">High 🔥</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">DEADLINE</label>
                  <input 
                    type="date" 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={deadline} onChange={e => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <Plus className="w-5 h-5" /> Create Task
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TodoList;