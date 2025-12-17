'use client';

import React, { memo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
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

const TreeNode: React.FC<TreeNodeProps> = memo(({ 
  person, 
  isSpouse = false, 
  onClick, 
  onAddChild, 
  canEdit = true,
  isSelected = false 
}) => {
  // Optimized spring transition - GPU accelerated
  const springTransition = {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.5,
  };

  // Don't render shared elements when selected (they're in the expanded card)
  if (isSelected) {
    return (
      <div 
        className={`relative flex flex-col items-center group tree-node-clickable ${isSpouse ? 'mt-4 md:mt-0 md:ml-4' : ''}`}
      >
        {/* Placeholder to maintain layout */}
        <div className="w-20 h-20 mb-2 opacity-0" />
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
      {/* Avatar Container - This is what morphs into the card */}
      <div 
        className="relative w-20 h-20 mb-2 cursor-pointer tree-node-clickable" 
        onClick={onClick}
      >
        {/* Pulse Ring - not animated */}
        <div className={`absolute inset-0 rounded-full border-2 ${isSpouse ? 'border-rose-400' : 'border-indigo-500'} opacity-20 animate-pulse`} />
        
        {/* Avatar Circle - Shared Element that morphs into card */}
        <motion.div
          layoutId={`avatar-container-${person.id}`}
          transition={springTransition}
          style={{ willChange: 'transform' }}
          className={`relative w-full h-full rounded-full border-2 ${isSpouse ? 'border-rose-400' : 'border-indigo-500'} bg-slate-50 overflow-hidden shadow-sm`}
        >
          <img 
            src={person.avatar} 
            alt={person.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>

        {/* Role Badge - Shared Element */}
        <motion.div
          layoutId={`role-${person.id}`}
          transition={springTransition}
          style={{ willChange: 'transform' }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-white px-2 py-0.5 rounded-full whitespace-nowrap shadow-md z-10"
        >
          <span className="text-white dark:text-slate-900 text-[10px] font-bold">
            {person.role}
          </span>
        </motion.div>

        {/* Add Child Button - Shared Element */}
        {onAddChild && canEdit && (
          <motion.button
            layoutId={`add-btn-${person.id}`}
            transition={springTransition}
            style={{ willChange: 'transform' }}
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
            className="absolute -right-1 top-0 w-6 h-6 rounded-full flex items-center justify-center shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white z-10 tree-node-clickable"
            title="Add child"
          >
            <Plus size={14} strokeWidth={3} />
          </motion.button>
        )}
        
        {/* Disabled add button for non-editors */}
        {onAddChild && !canEdit && (
          <div
            className="absolute -right-1 top-0 w-6 h-6 rounded-full flex items-center justify-center shadow-lg bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-50 z-10"
            title="View only - No edit permission"
          >
            <Plus size={14} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Name - Shared Element */}
      <motion.div
        layoutId={`name-${person.id}`}
        transition={springTransition}
        style={{ willChange: 'transform' }}
        className="text-center"
      >
        <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight mb-0.5">
          {person.name}
        </h4>
      </motion.div>
      
      {/* Birth - Not animated */}
      <span className="text-[10px] text-slate-500">{person.birth}</span>
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export default TreeNode;
