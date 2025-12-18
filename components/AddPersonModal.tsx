'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Calendar, UserPlus, Wand2, Loader2, ArrowDown, ArrowUp, Search, Users } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ApiClient } from '@/lib/api';
import DuplicateWarningDialog from './DuplicateWarningDialog';
import { Person } from '@/lib/types';

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

type RelationType = 'child' | 'father' | 'none';
type Gender = 'male' | 'female' | 'unknown';

// Generate avatar based on gender
const generateGenderAvatar = (name: string, gender: Gender): string => {
  const encodedName = encodeURIComponent(name || 'person');
  if (gender === 'male') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedName}&backgroundColor=b6e3f4&facialHairProbability=50`;
  } else if (gender === 'female') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedName}&backgroundColor=ffdfbf&facialHairProbability=0&top=longHair,hat`;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedName}&backgroundColor=c0aede`;
};

// Random data generators
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young'];

const generateRandomData = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const birthYear = Math.floor(Math.random() * (2010 - 1940 + 1)) + 1940;
  
  return {
    name: `${firstName} ${lastName}`,
    birth: birthYear.toString(),
    avatar: '',
  };
};

const AddPersonModal: React.FC<AddPersonModalProps> = ({ onClose, parentId, onSuccess, isContributor = false, isAdmin = false }) => {
  const addPerson = useAppStore((state) => state.addPerson);
  const familyData = useAppStore((state) => state.familyData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);

  // Relationship state
  const [relationType, setRelationType] = useState<RelationType>(parentId ? 'child' : 'none');
  const [linkedPersonId, setLinkedPersonId] = useState<string | undefined>(parentId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [gender, setGender] = useState<Gender>('male');

  // Only generate random data for admins, empty form for others
  const [formData, setFormData] = useState(isAdmin ? generateRandomData() : {
    name: '',
    birth: '',
    avatar: '',
  });

  // Find the linked person
  const linkedPerson = useMemo(() => {
    return linkedPersonId ? familyData.find(p => p.id === linkedPersonId) : undefined;
  }, [linkedPersonId, familyData]);

  // Filter persons for search
  const filteredPersons = useMemo(() => {
    if (!searchQuery.trim()) return familyData.slice(0, 8);
    const query = searchQuery.toLowerCase();
    return familyData.filter(p => p.name.toLowerCase().includes(query)).slice(0, 8);
  }, [familyData, searchQuery]);

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
        return false;
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
    
    const hasDuplicates = await checkForDuplicates();
    if (hasDuplicates) {
      setShowDuplicateWarning(true);
      return;
    }
    
    await proceedWithAdd();
  };

  const proceedWithAdd = async () => {
    setIsSubmitting(true);
    
    // Determine the role based on relationship
    let role = 'Family Member';
    if (relationType === 'child' && linkedPerson) {
      role = `Child of ${linkedPerson.name}`;
    } else if (relationType === 'father' && linkedPerson) {
      role = `Father of ${linkedPerson.name}`;
    }

    // Generate avatar based on gender if not custom
    const avatar = formData.avatar || generateGenderAvatar(formData.name, gender);

    // For "child" relationship: new person is child of linkedPerson
    // For "father" relationship: linkedPerson becomes child of new person (new person is their father)
    const effectiveParentId = relationType === 'child' ? linkedPersonId : undefined;
    
    console.log('[AddPersonModal] Creating person:', { relationType, linkedPersonId, effectiveParentId, gender });
    
    const result = await addPerson({
      name: formData.name,
      role: role,
      birth: formData.birth,
      avatar: avatar,
      children: relationType === 'father' && linkedPersonId ? [linkedPersonId] : [],
    }, effectiveParentId);

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
    setIsSubmitting(true);
    
    let role = 'Family Member';
    if (relationType === 'child' && linkedPerson) {
      role = `Child of ${linkedPerson.name}`;
    } else if (relationType === 'father' && linkedPerson) {
      role = `Father of ${linkedPerson.name}`;
    }

    // Generate avatar based on gender if not custom
    const avatar = formData.avatar || generateGenderAvatar(formData.name, gender);

    const effectiveParentId = relationType === 'child' ? linkedPersonId : undefined;
    
    const result = await addPerson({
      name: formData.name,
      role: role,
      birth: formData.birth,
      avatar: avatar,
      children: relationType === 'father' && linkedPersonId ? [linkedPersonId] : [],
    }, effectiveParentId);

    setIsSubmitting(false);
    
    onSuccess?.('Your suggestion has been submitted for admin review');
    onClose();
  };

  const selectPerson = (person: Person) => {
    setLinkedPersonId(person.id);
    setShowPersonPicker(false);
    setSearchQuery('');
  };

  const clearLink = () => {
    setLinkedPersonId(undefined);
    setRelationType('none');
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-xl rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Compact Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30">
                <UserPlus size={14} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Add Person
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:scale-110 transition-transform"
            >
              <X size={14} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {/* Auto-generate button - Admin only */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setFormData(generateRandomData())}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg text-xs font-medium transition-all"
              >
                <Wand2 size={12} />
                Random Data
              </button>
            )}

            {/* Name Input */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <User size={12} />
                Name
              </label>
              <input
                type="text"
                required
                dir="auto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                placeholder="John Doe"
              />
            </div>

            {/* Birth Year Input */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Calendar size={12} />
                Birth Year
              </label>
              <input
                type="text"
                dir="auto"
                value={formData.birth}
                onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                placeholder="1990"
              />
            </div>

            {/* Gender Selector */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <User size={12} />
                Gender
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    gender === 'male'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-400'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  ♂ Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    gender === 'female'
                      ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border-2 border-pink-400'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-pink-300'
                  }`}
                >
                  ♀ Female
                </button>
              </div>
            </div>

            {/* Link to Person - Minimalist Design */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Users size={12} />
                Link to Family Tree
              </label>

              {/* If no link yet, show picker trigger */}
              {!linkedPerson && (
                <button
                  type="button"
                  onClick={() => setShowPersonPicker(true)}
                  className="w-full px-3 py-2 text-sm text-left bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  + Select a person to link...
                </button>
              )}

              {/* Show selected person with relationship */}
              {linkedPerson && (
                <div className="space-y-2">
                  {/* Person card */}
                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <img
                      src={linkedPerson.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(linkedPerson.name)}&background=6366f1&color=fff&size=32`}
                      alt={linkedPerson.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{linkedPerson.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearLink}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Relationship toggle - compact pills */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRelationType('child')}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                        relationType === 'child'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-transparent'
                      }`}
                    >
                      <ArrowDown size={10} />
                      Child of {linkedPerson.name.split(' ')[0]}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRelationType('father')}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                        relationType === 'father'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-transparent'
                      }`}
                    >
                      <ArrowUp size={10} />
                      Father of {linkedPerson.name.split(' ')[0]}
                    </button>
                  </div>
                </div>
              )}

              {/* Person Picker Dropdown */}
              {showPersonPicker && (
                <div className="mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
                  {/* Search */}
                  <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Results */}
                  <div className="max-h-40 overflow-y-auto">
                    {filteredPersons.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No results</p>
                    ) : (
                      filteredPersons.map((person) => (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => selectPerson(person)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                        >
                          <img
                            src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=6366f1&color=fff&size=24`}
                            alt={person.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs text-slate-900 dark:text-white truncate">{person.name}</span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Close */}
                  <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => { setShowPersonPicker(false); setSearchQuery(''); }}
                      className="w-full py-1 text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Contributor notice */}
            {isContributor && (
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300 text-xs">
                📝 Submitted for admin review
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isChecking}
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isChecking}
                className="flex-1 px-3 py-2 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              >
                {isChecking ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Checking...
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  isContributor ? 'Submit' : 'Add'
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
