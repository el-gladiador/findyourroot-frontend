import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { FAMILY_DATA } from '@/lib/data';
import TreeNode from '@/components/TreeNode';
import PersonModal from '@/components/PersonModal';
import { Person } from '@/lib/types';

const TreeTab = () => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  // Manual construction of the tree for the "beautiful" visual requirement
  // In a real app, this would be recursive
  const grandpa = FAMILY_DATA.find(p => p.id === 'root-1');
  const grandma = FAMILY_DATA.find(p => p.id === 'root-wife');
  const dad = FAMILY_DATA.find(p => p.id === 'gen2-1');
  const mom = FAMILY_DATA.find(p => p.id === 'gen2-wife');
  const aunt = FAMILY_DATA.find(p => p.id === 'gen2-2');
  
  const kids = FAMILY_DATA.filter(p => ['gen3-1', 'gen3-2'].includes(p.id));
  const cousins = FAMILY_DATA.filter(p => ['gen3-3'].includes(p.id));

  if (!grandpa || !grandma || !dad || !mom || !aunt) return null;

  return (
    <div className="pb-24 pt-8 px-4 min-h-screen overflow-x-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] animate-in fade-in duration-500">
      <div className="flex flex-col items-center min-w-[320px]">
        
        {/* Gen 1 */}
        <div className="flex items-center gap-8 relative mb-12">
          <TreeNode person={grandpa} onClick={() => setSelectedPerson(grandpa)} />
          <div className="h-px w-8 bg-slate-300 dark:bg-slate-600"></div>
          <Heart size={16} className="text-rose-400 animate-pulse" />
          <div className="h-px w-8 bg-slate-300 dark:bg-slate-600"></div>
          <TreeNode person={grandma} isSpouse={false} onClick={() => setSelectedPerson(grandma)} />
          
          {/* Connector Down */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-px h-12 bg-slate-300 dark:bg-slate-600"></div>
        </div>

        {/* Gen 2 */}
        <div className="flex justify-center gap-12 relative mb-12 w-full">
          {/* Connector Top Horizontal */}
          <div className="absolute -top-4 left-[25%] right-[25%] h-px bg-slate-300 dark:bg-slate-600"></div>
          <div className="absolute -top-4 left-[25%] w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
          <div className="absolute -top-4 right-[25%] w-px h-4 bg-slate-300 dark:bg-slate-600"></div>

          {/* Branch 1 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4">
              <TreeNode person={dad} onClick={() => setSelectedPerson(dad)} />
              <div className="h-px w-4 bg-slate-300 dark:bg-slate-600"></div>
              <TreeNode person={mom} isSpouse={false} onClick={() => setSelectedPerson(mom)} />
            </div>
            {/* Connector Down to Gen 3 */}
            <div className="w-px h-12 bg-slate-300 dark:bg-slate-600 mt-2"></div>
          </div>

          {/* Branch 2 */}
          <div className="flex flex-col items-center">
             <TreeNode person={aunt} onClick={() => setSelectedPerson(aunt)} />
             {/* Connector Down to Gen 3 */}
             <div className="w-px h-12 bg-slate-300 dark:bg-slate-600 mt-2"></div>
          </div>
        </div>

        {/* Gen 3 */}
        <div className="flex justify-center gap-8 w-full">
           {/* Branch 1 Kids */}
           <div className="flex gap-4 relative">
             <div className="absolute -top-4 left-[20%] right-[20%] h-px bg-slate-300 dark:bg-slate-600"></div>
             <div className="absolute -top-4 left-[20%] w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
             <div className="absolute -top-4 right-[20%] w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
             
             {kids.map(kid => <TreeNode key={kid.id} person={kid} onClick={() => setSelectedPerson(kid)} />)}
           </div>

           {/* Branch 2 Kids */}
           <div className="flex gap-4 relative">
             <div className="absolute -top-4 left-1/2 w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
             {cousins.map(kid => <TreeNode key={kid.id} person={kid} onClick={() => setSelectedPerson(kid)} />)}
           </div>
        </div>
      </div>

      {/* Person Modal */}
      {selectedPerson && (
        <PersonModal person={selectedPerson} onClose={() => setSelectedPerson(null)} />
      )}
    </div>
  );
};

export default TreeTab;
