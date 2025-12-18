'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Save, Loader2 } from 'lucide-react';
import { Person } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface EditPersonModalProps {
  person: Person;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  isContributor?: boolean;
}

const EditPersonModal: React.FC<EditPersonModalProps> = ({ person, onClose, onSuccess, isContributor = false }) => {
  const updatePerson = useAppStore((state) => state.updatePerson);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: person.name,
    role: person.role,
    birth: person.birth,
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await updatePerson(person.id, {
      name: formData.name,
      role: formData.role,
      birth: formData.birth,
    });

    setIsSubmitting(false);
    
    if (result.isSuggestion && result.message) {
      onSuccess?.(result.message);
    } else if (result.success) {
      onSuccess?.('Person updated successfully');
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30">
              <User size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Edit Family Member
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <X size={18} className="text-slate-700 dark:text-slate-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <User size={16} />
              Name *
            </label>
            <input
              type="text"
              required
              dir="auto"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <User size={16} />
              Role *
            </label>
            <input
              type="text"
              required
              dir="auto"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
              placeholder="Father, Mother, Uncle, etc."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Calendar size={16} />
              Birth Year *
            </label>
            <input
              type="text"
              required
              value={formData.birth}
              onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
              placeholder="1990"
            />
          </div>

          {/* Contributor notice */}
          {isContributor && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
              <p className="font-medium">📝 Your changes will be submitted for review</p>
              <p className="text-xs mt-1 opacity-80">An admin will review and approve your edits.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-semibold transition-colors active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                {isContributor ? 'Submit for Review' : 'Save Changes'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditPersonModal;
