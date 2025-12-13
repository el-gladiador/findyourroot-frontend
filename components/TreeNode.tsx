import React from 'react';
import { Person } from '@/lib/types';

interface TreeNodeProps {
  person: Person;
  isSpouse?: boolean;
  onClick?: () => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ person, isSpouse = false, onClick }) => (
  <div 
    className={`relative flex flex-col items-center group ${isSpouse ? 'mt-4 md:mt-0 md:ml-4' : ''}`}
    onClick={onClick}
  >
    <div className="relative z-10 w-20 h-20 mb-2 transition-transform duration-300 group-hover:scale-105 cursor-pointer">
      <div className={`absolute inset-0 rounded-full border-2 ${isSpouse ? 'border-rose-400' : 'border-indigo-500'} opacity-20 animate-pulse`}></div>
      <img 
        src={person.avatar} 
        alt={person.name} 
        className={`w-full h-full rounded-full border-2 ${isSpouse ? 'border-rose-400' : 'border-indigo-500'} bg-slate-50 object-cover shadow-sm`}
      />
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">
        {person.role}
      </div>
    </div>
    <div className="text-center">
      <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight mb-0.5">{person.name}</h4>
      <span className="text-[10px] text-slate-500">{person.birth}</span>
    </div>
  </div>
);

export default TreeNode;
