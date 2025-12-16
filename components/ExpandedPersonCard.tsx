'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar, FileText, Edit3, Trash2, UserPlus } from 'lucide-react';
import { Person } from '@/lib/types';

interface ExpandedPersonCardProps {
  person: Person;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  canEdit?: boolean;
}

const ExpandedPersonCard: React.FC<ExpandedPersonCardProps> = ({
  person,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
  canEdit = false,
}) => {
  // Spring transition for smooth morphing
  const springTransition = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 32,
    mass: 0.8,
  };

  // Fade transition for elements that don't morph
  const fadeTransition = {
    duration: 0.3,
    ease: 'easeOut' as const,
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card Container */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none p-4">
        <motion.div
          layoutId={`card-container-${person.id}`}
          transition={springTransition}
          className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: 0.15, ...fadeTransition }}
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 hover:rotate-90 transition-all duration-300"
          >
            <X size={18} />
          </motion.button>

          {/* Gradient Header */}
          <motion.div
            layoutId={`header-bg-${person.id}`}
            transition={springTransition}
            className="h-28 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
          />

          {/* Avatar Section - Positioned to overlap header */}
          <div className="relative flex flex-col items-center -mt-14">
            {/* Avatar Glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.5, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 blur-xl"
            />

            {/* Avatar Image - Shared Element */}
            <motion.div
              layoutId={`avatar-${person.id}`}
              transition={springTransition}
              className="relative w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-xl"
            >
              <img
                src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=6366f1&color=fff&size=96`}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Role Badge - Shared Element */}
            <motion.div
              layoutId={`role-${person.id}`}
              transition={springTransition}
              className="mt-3 px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full"
            >
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                {person.role}
              </span>
            </motion.div>

            {/* Name - Shared Element */}
            <motion.h2
              layoutId={`name-${person.id}`}
              transition={springTransition}
              className="mt-3 text-2xl font-bold text-slate-800 dark:text-white text-center px-4"
            >
              {person.name}
            </motion.h2>
          </div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.15, ...fadeTransition }}
            className="px-5 pt-4 pb-5 space-y-3"
          >
            {/* Birth Info */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Calendar size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Birth Year</p>
                <p className="font-semibold text-slate-800 dark:text-white">{person.birth || 'Unknown'}</p>
              </div>
            </div>

            {/* Location Info */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <MapPin size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                <p className="font-semibold text-slate-800 dark:text-white">{person.location || 'Unknown'}</p>
              </div>
            </div>

            {/* Bio */}
            {person.bio && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bio</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{person.bio}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.25, ...fadeTransition }}
              className="flex gap-2 pt-2"
            >
              {/* Add Child Button - Shared Element */}
              {canEdit && onAddChild && (
                <motion.button
                  layoutId={`add-btn-${person.id}`}
                  transition={springTransition}
                  onClick={onAddChild}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] transition-all"
                >
                  <UserPlus size={18} />
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    Add Child
                  </motion.span>
                </motion.button>
              )}

              {/* Edit Button */}
              {canEdit && onEdit && (
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold active:scale-[0.98] transition-all"
                >
                  <Edit3 size={18} />
                  Edit
                </button>
              )}

              {/* Delete Button */}
              {canEdit && onDelete && (
                <button
                  onClick={onDelete}
                  className="w-12 flex items-center justify-center py-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/50 active:scale-[0.98] transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default ExpandedPersonCard;
