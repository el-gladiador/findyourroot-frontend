'use client';

import React, { memo } from 'react';
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

const ExpandedPersonCard: React.FC<ExpandedPersonCardProps> = memo(({
  person,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
  canEdit = false,
}) => {
  // Spring transition matching TreeNode
  const springTransition = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[99998] bg-black/70"
        onClick={onClose}
      />

      {/* Card positioned at center */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none p-4">
        {/* The circle morphs into this card - starts as circle (borderRadius: 40) ends as rounded rect (borderRadius: 24) */}
        <motion.div
          layoutId={`card-${person.id}`}
          transition={springTransition}
          style={{ 
            willChange: 'transform',
            borderRadius: 24, // Morphs from 40 (circle) to 24 (rounded rect)
          }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-800 shadow-2xl overflow-hidden pointer-events-auto"
        >
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.15, duration: 0.2 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/30 active:scale-95 transition-all"
          >
            <X size={18} />
          </motion.button>

          {/* Gradient Header */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" 
          />

          {/* Content Section */}
          <div className="relative px-5 pb-5">
            {/* Avatar - morphs from full-size to smaller centered */}
            <div className="flex justify-center -mt-12 mb-3">
              <div className="relative">
                {/* Glow effect */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 blur-xl" 
                />
                <div className="relative w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-xl">
                  <motion.img
                    layoutId={`avatar-img-${person.id}`}
                    transition={springTransition}
                    src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=6366f1&color=fff&size=96`}
                    alt={person.name}
                    className="w-full h-full object-cover"
                    style={{ willChange: 'transform' }}
                  />
                </div>
              </div>
            </div>

            {/* Role Badge - Shared Element */}
            <div className="flex justify-center mb-2">
              <motion.div
                layoutId={`role-${person.id}`}
                transition={springTransition}
                style={{ willChange: 'transform' }}
                className="px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full"
              >
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {person.role}
                </span>
              </motion.div>
            </div>

            {/* Name - Shared Element */}
            <motion.div
              layoutId={`name-${person.id}`}
              transition={springTransition}
              style={{ willChange: 'transform' }}
              className="text-center mb-4"
            >
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {person.name}
              </h2>
            </motion.div>

            {/* Info Cards - Fade in */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
              className="space-y-2.5"
            >
              {/* Birth Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Birth Year</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{person.birth || 'Unknown'}</p>
                </div>
              </div>

              {/* Location Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Location</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{person.location || 'Unknown'}</p>
                </div>
              </div>

              {/* Bio */}
              {person.bio && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Bio</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{person.bio}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              className="flex gap-2 mt-4"
            >
              {/* Add Child Button */}
              {canEdit && onAddChild && (
                <button
                  onClick={onAddChild}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
                >
                  <UserPlus size={18} />
                  <span>Add Child</span>
                </button>
              )}

              {/* Edit Button */}
              {canEdit && onEdit && (
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold active:scale-[0.98] transition-all"
                >
                  <Edit3 size={18} />
                  Edit
                </button>
              )}

              {/* Delete Button */}
              {canEdit && onDelete && (
                <button
                  onClick={onDelete}
                  className="w-11 flex items-center justify-center py-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/50 active:scale-[0.98] transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
});

ExpandedPersonCard.displayName = 'ExpandedPersonCard';

export default ExpandedPersonCard;
