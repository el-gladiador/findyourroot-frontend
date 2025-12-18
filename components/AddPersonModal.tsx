'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Calendar, UserPlus, Wand2, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ApiClient } from '@/lib/api';
import DuplicateWarningDialog from './DuplicateWarningDialog';

interface AddPersonModalProps {
  onClose: () => void;
  parentId?: string;
  onSuccess?: (message: string) => void;
  isContributor?: boolean;
  isAdmin?: boolean;
}

interface DuplicateMatch {
  person_id: string;
  name: string;
  similarity: number;
  match_type: string;
}

// Random data generators
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young'];
const roles = ['Father', 'Mother', 'Son', 'Daughter', 'Uncle', 'Aunt', 'Grandfather', 'Grandmother', 'Brother', 'Sister', 'Cousin', 'Nephew', 'Niece'];

const generateRandomData = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const birthYear = Math.floor(Math.random() * (2010 - 1940 + 1)) + 1940;
  
  return {
    name: `${firstName} ${lastName}`,
    role: roles[Math.floor(Math.random() * roles.length)],
    birth: birthYear.toString(),
    avatar: '',
  };
};

const AddPersonModal: React.FC<AddPersonModalProps> = ({ onClose, parentId, onSuccess, isContributor = false, isAdmin = false }) => {
  const addPerson = useAppStore((state) => state.addPerson);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);

  // Only generate random data for admins, empty form for others
  const [formData, setFormData] = useState(isAdmin ? generateRandomData() : {
    name: '',
    role: '',
    birth: '',
    avatar: '',
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Check for duplicates before adding
  const checkForDuplicates = async (): Promise<boolean> => {
    if (!formData.name.trim()) return false;
    
    setIsChecking(true);
    try {
      const response = await ApiClient.checkDuplicateName(formData.name, 0.75);
      if (response.error) {
        console.error('Error checking duplicates:', response.error);
        return false; // Allow adding if check fails
      }
      
      if (response.data?.has_duplicates && response.data.matches.length > 0) {
        setDuplicateMatches(response.data.matches);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // First check for duplicates
    const hasDuplicates = await checkForDuplicates();
    if (hasDuplicates) {
      setShowDuplicateWarning(true);
      return;
    }
    
    // No duplicates, proceed with adding
    await proceedWithAdd();
  };

  const proceedWithAdd = async () => {
    setIsSubmitting(true);
    
    console.log('[AddPersonModal] Creating person with parentId:', parentId, 'isContributor:', isContributor);
    
    // Let backend handle avatar generation if not provided
    const result = await addPerson({
      name: formData.name,
      role: formData.role,
      birth: formData.birth,
      avatar: formData.avatar,
      children: [],
    }, parentId);

    setIsSubmitting(false);
    
    if (result.isSuggestion && result.message) {
      onSuccess?.(result.message);
    } else if (!result.isSuggestion) {
      onSuccess?.('Person added successfully');
    }

    onClose();
  };

  const handleAddAnyway = async () => {
    setShowDuplicateWarning(false);
    await proceedWithAdd();
  };

  const handleSubmitSuggestion = async () => {
    setShowDuplicateWarning(false);
    // For non-admin, we create a suggestion instead
    setIsSubmitting(true);
    
    const result = await addPerson({
      name: formData.name,
      role: formData.role,
      birth: formData.birth,
      avatar: formData.avatar,
      children: [],
    }, parentId);

    setIsSubmitting(false);
    
    onSuccess?.('Your suggestion has been submitted for admin review');
    onClose();
  };

  return (
    <>
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
                <UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add Family Member
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">افزودن عضو جدید به خانواده</p>
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
            {/* Auto-generate button - Admin only */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setFormData(generateRandomData())}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-medium transition-all active:scale-95"
              >
                <Wand2 size={18} />
                Generate Random Data
              </button>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <User size={16} />
                Name / نام *
              </label>
              <input
                type="text"
                required
                dir="auto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                placeholder="محمد علی / John Doe"
              />
              <p className="text-xs text-slate-400 mt-1">Persian and English names supported</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <User size={16} />
                Role / نسبت *
              </label>
              <input
                type="text"
                required
                dir="auto"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                placeholder="پدر، مادر، عمو / Father, Mother, Uncle"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Calendar size={16} />
                Birth Year / سال تولد (optional)
              </label>
              <input
                type="text"
                dir="auto"
                value={formData.birth}
                onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                placeholder="1990 / ۱۳۶۹"
              />
            </div>

            {/* Contributor notice */}
            {isContributor && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
                <p className="font-medium">📝 Your addition will be submitted for review</p>
                <p className="text-xs mt-1 opacity-80">An admin will review and approve your suggestion.</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isChecking}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isChecking}
                className="flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {isChecking ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Checking...
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  isContributor ? 'Submit for Review' : 'Add Person'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        isOpen={showDuplicateWarning}
        onClose={() => setShowDuplicateWarning(false)}
        inputName={formData.name}
        matches={duplicateMatches}
        isAdmin={isAdmin}
        onAddAnyway={handleAddAnyway}
        onSubmitSuggestion={handleSubmitSuggestion}
        onCancel={() => setShowDuplicateWarning(false)}
      />
    </>
  );
};

export default AddPersonModal;
