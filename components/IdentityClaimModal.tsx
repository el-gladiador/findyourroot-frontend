'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Search, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { Person, IdentityClaimRequest } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface IdentityClaimModalProps {
  onClose: () => void;
}

const IdentityClaimModal: React.FC<IdentityClaimModalProps> = ({ onClose }) => {
  const familyData = useAppStore((state) => state.familyData);
  const user = useAppStore((state) => state.user);
  const refreshUser = useAppStore((state) => state.refreshUser);
  
  const [step, setStep] = useState<'status' | 'search' | 'confirm'>('status');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Current claim status
  const [isLinked, setIsLinked] = useState(false);
  const [linkedPerson, setLinkedPerson] = useState<Person | null>(null);
  const [existingClaim, setExistingClaim] = useState<IdentityClaimRequest | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    fetchClaimStatus();
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const fetchClaimStatus = async () => {
    setIsLoading(true);
    try {
      const response = await ApiClient.getMyIdentityClaim();
      if (response.data) {
        setIsLinked(response.data.linked);
        setLinkedPerson(response.data.person || null);
        setExistingClaim(response.data.claim || null);
        
        // If linked, refresh user data in global store to update UI everywhere
        if (response.data.linked) {
          await refreshUser();
        }
      }
    } catch (err) {
      console.error('Failed to fetch claim status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPeople = familyData.filter(person => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      person.name.toLowerCase().includes(term) ||
      person.role.toLowerCase().includes(term) ||
      (person.location && person.location.toLowerCase().includes(term))
    );
  }).filter(person => !person.linked_user_id); // Only show unclaimed people

  const handleSubmit = async () => {
    if (!selectedPerson) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await ApiClient.claimIdentity(selectedPerson.id, message);
      if (response.error) {
        setError(response.error);
      } else {
        setSuccess('Your identity claim has been submitted! An admin will review it shortly.');
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError('Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <UserCheck size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {step === 'status' ? 'Identity Status' : step === 'search' ? 'Find Yourself' : 'Confirm Identity'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <X size={18} className="text-slate-700 dark:text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : step === 'status' ? (
            <div className="space-y-4">
              {/* Already linked */}
              {isLinked && linkedPerson && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="text-green-500" size={24} />
                    <h3 className="font-semibold text-green-800 dark:text-green-200">You are linked to the tree!</h3>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3">
                    <img src={linkedPerson.avatar} alt={linkedPerson.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{linkedPerson.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{linkedPerson.role}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing claim */}
              {!isLinked && existingClaim && (
                <div className={`rounded-xl p-4 border ${
                  existingClaim.status === 'pending' 
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : existingClaim.status === 'rejected'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(existingClaim.status)}
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      {existingClaim.status === 'pending' 
                        ? 'Claim Pending Review' 
                        : existingClaim.status === 'rejected'
                        ? 'Claim Rejected'
                        : 'Claim Status'}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    You claimed to be: <strong>{existingClaim.person_name}</strong>
                  </p>
                  {existingClaim.message && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-2">
                      "{existingClaim.message}"
                    </p>
                  )}
                  {existingClaim.status === 'rejected' && existingClaim.review_notes && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      Admin notes: {existingClaim.review_notes}
                    </p>
                  )}
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(existingClaim.status)}`}>
                    {existingClaim.status.charAt(0).toUpperCase() + existingClaim.status.slice(1)}
                  </span>
                </div>
              )}

              {/* No claim yet */}
              {!isLinked && (!existingClaim || existingClaim.status === 'rejected') && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                    <UserCheck size={32} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Are you in the family tree?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    If you see yourself in the tree, you can claim that person as your identity. 
                    An admin will review and verify your request.
                  </p>
                  <button
                    onClick={() => setStep('search')}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Find Myself in the Tree
                  </button>
                </div>
              )}
            </div>
          ) : step === 'search' ? (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  dir="auto"
                  placeholder="Search by name, role, or location..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all outline-none"
                />
              </div>

              {/* People list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredPeople.length === 0 ? (
                  <p className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No unclaimed people found matching your search.
                  </p>
                ) : (
                  filteredPeople.map(person => (
                    <button
                      key={person.id}
                      onClick={() => {
                        setSelectedPerson(person);
                        setStep('confirm');
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                    >
                      <img src={person.avatar} alt={person.name} className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{person.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{person.role} • {person.birth}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => setStep('status')}
                className="w-full py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl">
                  <CheckCircle size={18} />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {selectedPerson && !success && (
                <>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                      You are claiming to be:
                    </p>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3">
                      <img src={selectedPerson.avatar} alt={selectedPerson.name} className="w-12 h-12 rounded-full" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{selectedPerson.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedPerson.role} • Born {selectedPerson.birth}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedPerson.location}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tell the admin why you believe this is you (optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      dir="auto"
                      placeholder="e.g., I am the son of X and was born in Y..."
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setStep('search')}
                      className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <UserCheck size={18} />
                          Submit Claim
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdentityClaimModal;
