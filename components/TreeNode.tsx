'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Person } from '@/lib/types';

interface TreeNodeProps {
  person: Person;
  isSpouse?: boolean;
  onClick?: () => void;
  onAddChild?: () => void;
  canEdit?: boolean;
  isSelected?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  person, 
  isSpouse = false, 
  onClick, 
  onAddChild, 
  canEdit = true,
  isSelected = false 
}) => {
  // Spring transition matching ExpandedPersonCard
  const springTransition = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 32,
    mass: 0.8,
  };

  // Don't render shared elements when selected (they're in the expanded card)
  if (isSelected) {
    return (
      <div 
        className={`relative flex flex-col items-center group tree-node-clickable ${isSpouse ? 'mt-4 md:mt-0 md:ml-4' : ''}`}
      >
        {/* Placeholder to maintain layout */}
        <div className="w-20 h-20 mb-2" />
        <div className="text-center opacity-0">
          <h4 className="text-xs font-bold leading-tight mb-0.5">{person.name}</h4>
          <span className="text-[10px]">{person.birth}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative flex flex-col items-center group tree-node-clickable ${isSpouse ? 'mt-4 md:mt-0 md:ml-4' : ''}`}
    >
      {/* Card Container - for potential future card-style expansion */}
      <motion.div
        layoutId={`card-container-${person.id}`}
        transition={springTransition}
        className="relative z-10"
      >
        {/* Hidden header bg placeholder for morph */}
        <motion.div
          layoutId={`header-bg-${person.id}`}
          transition={springTransition}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-0"
        />

        <div 
          className="relative w-20 h-20 mb-2 transition-transform duration-300 group-hover:scale-105 cursor-pointer tree-node-clickable" 
          onClick={onClick}
        >
          {/* Pulse Ring */}
          <div className={`absolute inset-0 rounded-full border-2 ${isSpouse ? 'border-rose-400' : 'border-indigo-500'} opacity-20 animate-pulse`} />
          
          {/* Avatar - Shared Element */}
          <motion.div
            layoutId={`avatar-${person.id}`}
            transition={springTransition}
            className={`w-full h-full rounded-full border-2 ${isSpouse ? 'border-rose-400' : 'border-indigo-500'} bg-slate-50 overflow-hidden shadow-sm`}
          >
            <img 
              src={person.avatar} 
              alt={person.name} 
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Role Badge - Shared Element */}
          <motion.div
            layoutId={`role-${person.id}`}
            transition={springTransition}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-white px-2 py-0.5 rounded-full whitespace-nowrap shadow-md"
          >
            <span className="text-white dark:text-slate-900 text-[10px] font-bold">
              {person.role}
            </span>
          </motion.div>

          {/* Add Child Button - Shared Element */}
          {onAddChild && (
            <motion.button
              layoutId={`add-btn-${person.id}`}
              transition={springTransition}
              onClick={(e) => {
                e.stopPropagation();
                onAddChild();
              }}
              disabled={!canEdit}
              className={`absolute -right-1 top-0 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-colors tree-node-clickable ${
                canEdit 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-50'
              }`}
              title={canEdit ? "Add child" : "View only - No edit permission"}
            >
              <Plus size={14} strokeWidth={3} />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Name and Birth - Shared Elements */}
      <div className="text-center">
        <motion.h4
          layoutId={`name-${person.id}`}
          transition={springTransition}
          className="text-xs font-bold text-slate-800 dark:text-white leading-tight mb-0.5"
        >
          {person.name}
        </motion.h4>
        <span className="text-[10px] text-slate-500">{person.birth}</span>
      </div>
    </div>
  );
};

export default TreeNode;
