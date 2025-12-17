'use client';

import React, { memo } from 'react';
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

const TreeNode: React.FC<TreeNodeProps> = memo(({ 
  person, 
  isSpouse = false, 
  onClick, 
  onAddChild, 
  canEdit = true,
  isSelected = false 
}) => {
  // Layout transition for shared elements - must match ExpandedPersonCard
  const layoutTransition = {
    type: 'tween' as const,
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as const,
  };

  // When selected, hide content but keep layout space
  if (isSelected) {
    return (
      <div className={`relative flex flex-col items-center group tree-node-clickable ${isSpouse ? 'mt-4 md:mt-0 md:ml-4' : ''}`}>
        {/* Invisible placeholder for avatar */}
        <div className="relative w-20 h-20 mb-2">
          <motion.div
            layoutId={`card-${person.id}`}
            transition={layoutTransition}
            style={{ 
              width: 80,
              height: 80,
              borderRadius: 40,
            }}
            className="absolute inset-0 bg-white dark:bg-slate-800"
          />
        </div>
        {/* Invisible placeholders for text */}
        <div className="text-center invisible">
          <h4 className="text-xs font-bold leading-tight mb-0.5">{person.name}</h4>
        </div>
        <span className="text-[10px] invisible">{person.birth}</span>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center group tree-node-clickable ${isSpouse ? 'mt-4 md:mt-0 md:ml-4' : ''}`}>
      {/* Avatar Container */}
      <div className="relative w-20 h-20 mb-2 cursor-pointer tree-node-clickable" onClick={onClick}>
        {/* Pulse Ring */}
        <div className={`absolute inset-0 rounded-full border-2 ${isSpouse ? 'border-rose-400' : 'border-indigo-500'} opacity-20 animate-pulse`} />
        
        {/* Main Circle - This morphs into the card */}
        <motion.div
          layoutId={`card-${person.id}`}
          transition={layoutTransition}
          style={{ 
            borderRadius: 40, // Start as perfect circle (half of 80px)
          }}
          className={`relative w-full h-full border-2 ${isSpouse ? 'border-rose-400' : 'border-indigo-500'} bg-white dark:bg-slate-800 overflow-hidden shadow-lg`}
        >
          {/* Avatar Image inside the morphing container - Use Instagram avatar if available */}
          <motion.img 
            layoutId={`avatar-img-${person.id}`}
            transition={layoutTransition}
            src={
              (person.linked_user_id && person.instagram_avatar_url) 
                ? person.instagram_avatar_url 
                : person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=6366f1&color=fff&size=80`
            } 
            alt={person.name} 
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Role Badge */}
        <motion.div
          layoutId={`role-${person.id}`}
          transition={layoutTransition}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-white px-2 py-0.5 rounded-full whitespace-nowrap shadow-md z-10"
        >
          <span className="text-white dark:text-slate-900 text-[10px] font-bold">
            {person.role}
          </span>
        </motion.div>

        {/* Add Child Button - No morph, just regular button */}
        {onAddChild && canEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
            className="absolute -right-1 top-0 w-6 h-6 rounded-full flex items-center justify-center shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white z-10 tree-node-clickable active:scale-95 transition-transform"
            title="Add child"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        )}
        
        {/* Disabled add button */}
        {onAddChild && !canEdit && (
          <div
            className="absolute -right-1 top-0 w-6 h-6 rounded-full flex items-center justify-center shadow-lg bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-50 z-10"
            title="View only"
          >
            <Plus size={14} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Name */}
      <motion.div
        layoutId={`name-${person.id}`}
        transition={layoutTransition}
        className="text-center"
      >
        <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight mb-0.5">
          {person.name}
        </h4>
      </motion.div>
      
      {/* Birth */}
      <span className="text-[10px] text-slate-500">{person.birth}</span>
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export default TreeNode;
