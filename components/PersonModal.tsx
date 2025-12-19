'use client';

import React, { useEffect, useState } from 'react';
import { X, MapPin, Calendar, User, Heart, Phone, Mail, Home, Trash2, Edit } from 'lucide-react';
import { Person } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface PersonModalProps {
  person: Person;
  onClose: () => void;
  onEdit?: () => void;
}

const PersonModal: React.FC<PersonModalProps> = ({ person, onClose, onEdit }) => {
  const removePerson = useAppStore((state) => state.removePerson);
  const user = useAppStore((state) => state.user);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  
  // Check if user owns this node or is admin
  const isOwner = person.created_by === user?.id;
  const isAdmin = user?.role === 'admin';
  const canEdit = (user?.role === 'co-admin' && isOwner) || isAdmin;

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleDelete = async () => {
    if (!canEdit) {
      if (user?.role === 'co-admin') {
        setPermissionWarning('You can only delete nodes you created. This node was created by another user.');
      } else {
        setPermissionWarning('You need Co-Admin or Admin permissions to delete people from the tree.');
      }
      setTimeout(() => setPermissionWarning(null), 4000);
      return;
    }
    if (confirm(`Are you sure you want to remove ${person.name} from the family tree?`)) {
      await removePerson(person.id);
      onClose();
    }
  };

  const handleEditClick = () => {
    if (!canEdit) {
      if (user?.role === 'co-admin') {
        setPermissionWarning('You can only edit nodes you created. This node was created by another user.');
      } else {
        setPermissionWarning('You need Co-Admin or Admin permissions to edit people in the tree.');
      }
      setTimeout(() => setPermissionWarning(null), 4000);
      return;
    }
    onEdit?.();
  };
  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-500 max-h-[85vh] overflow-y-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Image */}
        <div className="relative">
          <div className="absolute top-3 right-3 z-10">
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-90 transition-all duration-300 active:scale-95"
            >
              <X size={18} className="text-slate-700 dark:text-slate-300" />
            </button>
          </div>
          
          <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          </div>
          
          <div className="absolute -bottom-10 left-4 animate-in slide-in-from-left-4 duration-700">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-xl opacity-50 animate-pulse"></div>
              <img 
                src={person.avatar} 
                alt={person.name}
                className="relative w-20 h-20 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 px-5 pb-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{person.name}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
              <Heart size={14} />
              {person.role}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid gap-3 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Born</p>
                <p className="text-sm text-slate-900 dark:text-white font-medium">{person.birth}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <MapPin size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Location</p>
                <p className="text-sm text-slate-900 dark:text-white font-medium">{person.location}</p>
              </div>
            </div>

            {person.bio && (
              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">About</p>
                  <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{person.bio}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            {onEdit && (
              <button 
                onClick={handleEditClick}
                disabled={!canEdit}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-colors active:scale-95 font-medium ${
                  canEdit 
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50' 
                    : 'bg-gray-100 dark:bg-gray-700/30 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Edit size={18} />
                <span className="text-sm">Edit</span>
              </button>
            )}
            <button 
              onClick={handleDelete}
              disabled={!canEdit}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-colors active:scale-95 font-medium ${
                canEdit 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50' 
                  : 'bg-gray-100 dark:bg-gray-700/30 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Trash2 size={18} />
              <span className="text-sm">Delete</span>
            </button>
          </div>

          {/* Permission Warning */}
          {permissionWarning && (
            <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-500 dark:border-amber-600 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
              {permissionWarning}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonModal;
