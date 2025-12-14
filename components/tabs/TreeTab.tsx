import React, { useState, useRef, useEffect } from 'react';
import { Heart, Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TreeNode from '@/components/TreeNode';
import PersonModal from '@/components/PersonModal';
import AddPersonModal from '@/components/AddPersonModal';
import { Person } from '@/lib/types';

const TreeTab = () => {
  const familyData = useAppStore((state) => state.familyData);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [parentForNewPerson, setParentForNewPerson] = useState<string | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  // Zoom and Pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const pendingTransform = useRef<{ scale: number; translate: { x: number; y: number } } | null>(null);
  
  // Dynamic refs storage
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  
  // Find root nodes (nodes with no parents)
  const getRootNodes = () => {
    const allChildIds = new Set(familyData.flatMap(p => p.children));
    return familyData.filter(p => !allChildIds.has(p.id));
  };
  
  // Get children for a person
  const getChildren = (personId: string) => {
    const person = familyData.find(p => p.id === personId);
    if (!person) return [];
    return person.children.map(childId => familyData.find(p => p.id === childId)).filter(Boolean) as Person[];
  };
  
  // Find spouse (someone who shares children but isn't in parent-child relationship)
  const findSpouse = (personId: string) => {
    const person = familyData.find(p => p.id === personId);
    if (!person || person.children.length === 0) return null;
    
    return familyData.find(p => 
      p.id !== personId && 
      p.children.some(childId => person.children.includes(childId))
    ) || null;
  };
  
  const rootNodes = getRootNodes();
  
  const setNodeRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      nodeRefs.current.set(id, el);
    } else {
      nodeRefs.current.delete(id);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 1.2));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.3));
  };

  const handleResetZoom = () => {
    if (!containerRef.current || !viewportRef.current) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      return;
    }

    // Get the dimensions of the tree content and viewport
    const containerRect = containerRef.current.getBoundingClientRect();
    const viewportRect = viewportRef.current.getBoundingClientRect();
    
    // Calculate the current actual size of the content (accounting for current scale)
    const contentWidth = containerRect.width / scale;
    const contentHeight = containerRect.height / scale;
    
    // Calculate scale to fit with some padding (80% of viewport)
    const scaleX = (viewportRect.width * 0.8) / contentWidth;
    const scaleY = (viewportRect.height * 0.8) / contentHeight;
    const optimalScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.2);
    
    setScale(optimalScale);
    setTranslate({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY / 500;
    const newScale = Math.min(Math.max(scale + delta, 0.3), 1.2);
    setScale(newScale);
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tree-node-clickable')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setTranslate({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Apply pending transform with RAF for smooth updates
  const applyTransform = () => {
    if (pendingTransform.current) {
      setScale(pendingTransform.current.scale);
      setTranslate(pendingTransform.current.translate);
      pendingTransform.current = null;
    }
    rafId.current = null;
  };

  const scheduleTransformUpdate = (newScale: number, newTranslate: { x: number; y: number }) => {
    pendingTransform.current = { scale: newScale, translate: newTranslate };
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(applyTransform);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Pan only
      if ((e.target as HTMLElement).closest('.tree-node-clickable')) return;
      const touch = e.touches[0];
      setIsPanning(true);
      setStartPan({ x: touch.clientX - translate.x, y: touch.clientY - translate.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      // Pan with RAF
      const touch = e.touches[0];
      const newTranslate = {
        x: touch.clientX - startPan.x,
        y: touch.clientY - startPan.y
      };
      scheduleTransformUpdate(scale, newTranslate);
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    
    // Cancel any pending RAF
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
      // Apply final transform
      if (pendingTransform.current) {
        setScale(pendingTransform.current.scale);
        setTranslate(pendingTransform.current.translate);
        pendingTransform.current = null;
      }
    }
  };

  useEffect(() => {
    const calculateLines = () => {
      if (!containerRef.current) return;
      
      const newLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
      
      const getNodePosition = (personId: string) => {
        const el = nodeRefs.current.get(personId);
        if (!el) return null;
        
        const img = el.querySelector('img');
        if (!img) return null;
        
        // Get position relative to the container (not viewport)
        const containerRect = containerRef.current!.getBoundingClientRect();
        const rect = img.getBoundingClientRect();
        
        // Calculate actual position in container's coordinate space (unscaled)
        const x = (rect.left + rect.width / 2 - containerRect.left) / scale;
        const y = (rect.top + rect.height / 2 - containerRect.top) / scale;
        const bottom = (rect.bottom - containerRect.top) / scale;
        const top = (rect.top - containerRect.top) / scale;
        const left = (rect.left - containerRect.left) / scale;
        const right = (rect.right - containerRect.left) / scale;
        
        return { x, y, bottom, top, left, right };
      };
      
      // Draw connections for each person with children
      familyData.forEach(person => {
        if (person.children.length === 0) return;
        
        const spouse = findSpouse(person.id);
        const personPos = getNodePosition(person.id);
        const spousePos = spouse ? getNodePosition(spouse.id) : null;
        const children = getChildren(person.id);
        
        if (!personPos) return;
        
        // If has spouse, draw horizontal line between them
        if (spouse && spousePos) {
          const leftPos = personPos.x < spousePos.x ? personPos : spousePos;
          const rightPos = personPos.x < spousePos.x ? spousePos : personPos;
          
          newLines.push({
            x1: leftPos.right,
            y1: leftPos.y,
            x2: rightPos.left,
            y2: rightPos.y
          });
        }
        
        // Draw lines to children
        if (children.length > 0) {
          const childPositions = children.map(child => ({
            child,
            pos: getNodePosition(child.id)
          })).filter(c => c.pos !== null);
          
          if (childPositions.length === 0) return;
          
          // Calculate parent midpoint
          const parentMidX = spousePos ? (personPos.x + spousePos.x) / 2 : personPos.x;
          const parentBottom = spousePos ? Math.max(personPos.bottom, spousePos.bottom) : personPos.bottom;
          
          // Find leftmost and rightmost children
          const sortedChildren = [...childPositions].sort((a, b) => a.pos!.x - b.pos!.x);
          const leftmostChild = sortedChildren[0].pos!;
          const rightmostChild = sortedChildren[sortedChildren.length - 1].pos!;
          
          const childrenHorizontalY = leftmostChild.top - 16;
          
          // Vertical line down from parent(s)
          newLines.push({
            x1: parentMidX,
            y1: parentBottom,
            x2: parentMidX,
            y2: childrenHorizontalY
          });
          
          // Horizontal line across children (if multiple)
          if (childPositions.length > 1) {
            newLines.push({
              x1: leftmostChild.x,
              y1: childrenHorizontalY,
              x2: rightmostChild.x,
              y2: childrenHorizontalY
            });
          }
          
          // Vertical lines down to each child
          childPositions.forEach(({ pos }) => {
            if (pos) {
              newLines.push({
                x1: pos.x,
                y1: childrenHorizontalY,
                x2: pos.x,
                y2: pos.top
              });
            }
          });
        }
      });
      
      setLines(newLines);
    };
    
    // Calculate on mount and after a small delay to ensure DOM is ready
    const timer = setTimeout(calculateLines, 100);
    calculateLines();
    
    window.addEventListener('resize', calculateLines);
    return () => {
      window.removeEventListener('resize', calculateLines);
      clearTimeout(timer);
    };
  }, [familyData, scale]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // Render a person node with their spouse and children recursively
  const renderPersonWithFamily = (person: Person, generation: number) => {
    const spouse = findSpouse(person.id);
    const children = getChildren(person.id);
    
    return (
      <div key={person.id} className="flex flex-col items-center">
        {/* Person and Spouse */}
        <div className="flex items-center gap-4 mb-12">
          <div 
            ref={setNodeRef(person.id)}
            className="cursor-pointer tree-node-clickable"
          >
            <TreeNode 
              person={person} 
              onClick={() => setSelectedPerson(person)}
              onAddChild={() => {
                setParentForNewPerson(person.id);
                setShowAddModal(true);
              }}
            />
          </div>
          
          {spouse && (
            <>
              <Heart size={16} className="text-rose-400 animate-pulse" />
              <div 
                ref={setNodeRef(spouse.id)}
                className="cursor-pointer tree-node-clickable"
              >
                <TreeNode 
                  person={spouse} 
                  isSpouse 
                  onClick={() => setSelectedPerson(spouse)}
                  onAddChild={() => {
                    setParentForNewPerson(spouse.id);
                    setShowAddModal(true);
                  }}
                />
              </div>
            </>
          )}
        </div>
        
        {/* Children */}
        {children.length > 0 && (
          <div className="flex gap-8 justify-center">
            {children.map(child => (
              <div key={child.id} ref={setNodeRef(child.id)} className="cursor-pointer tree-node-clickable">
                <TreeNode 
                  person={child} 
                  onClick={() => setSelectedPerson(child)}
                  onAddChild={() => {
                    setParentForNewPerson(child.id);
                    setShowAddModal(true);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (rootNodes.length === 0) {
    return (
      <div className="pb-24 pt-8 px-4 min-h-screen flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">No family members yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Add First Person
          </button>
        </div>
        
        {showAddModal && (
          <AddPersonModal onClose={() => { setShowAddModal(false); setParentForNewPerson(undefined); }} parentId={parentForNewPerson} />
        )}
      </div>
    );
  }

  const hasModalOpen = selectedPerson !== null || showAddModal;

  return (
    <>
    <div 
      ref={viewportRef}
      className="fixed inset-0 top-0 bottom-0 left-0 right-0 overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] animate-in fade-in duration-500 touch-none overscroll-none"
      onWheel={hasModalOpen ? undefined : handleWheel}
      onMouseDown={hasModalOpen ? undefined : handleMouseDown}
      onMouseMove={hasModalOpen ? undefined : handleMouseMove}
      onMouseUp={hasModalOpen ? undefined : handleMouseUp}
      onMouseLeave={hasModalOpen ? undefined : handleMouseUp}
      onTouchStart={hasModalOpen ? undefined : handleTouchStart}
      onTouchMove={hasModalOpen ? undefined : handleTouchMove}
      onTouchEnd={hasModalOpen ? undefined : handleTouchEnd}
      style={{ cursor: hasModalOpen ? 'default' : (isPanning ? 'grabbing' : 'grab'), touchAction: 'none' }}
    >
      <div 
        className="absolute top-1/2 left-1/2"
        style={{
          transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px)) scale(${scale})`,
          transformOrigin: 'center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          willChange: 'transform'
        }}
      >
        <div ref={containerRef} className="relative flex flex-col items-center gap-8">
          {/* SVG Layer for connections */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ zIndex: 0, minHeight: '100%' }}
          >
            {lines.map((line, idx) => (
              <line
                key={idx}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-600"
                strokeWidth="2"
              />
            ))}
          </svg>
          
          {/* Render tree starting from root nodes */}
          <div className="flex gap-12 flex-wrap justify-center" style={{ zIndex: 1, position: 'relative' }}>
            {rootNodes.map(root => renderPersonWithFamily(root, 0))}
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="fixed left-6 flex flex-col gap-2 z-50" style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center active:scale-95"
          title="Zoom in"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center active:scale-95"
          title="Zoom out"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleResetZoom}
          className="w-10 h-10 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center active:scale-95"
          title="Reset zoom"
        >
          <Maximize2 size={20} />
        </button>
        <div className="text-center text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg px-2 py-1 shadow-md">
          {Math.round(scale * 100)}%
        </div>
      </div>

    </div>
    
    {/* Modals - Rendered outside the fixed viewport to ensure proper z-index stacking */}
    {/* Person Modal */}
    {selectedPerson && (
      <PersonModal person={selectedPerson} onClose={() => setSelectedPerson(null)} />
    )}

    {/* Add Person Modal */}
    {showAddModal && (
      <AddPersonModal 
        onClose={() => { 
          setShowAddModal(false); 
          setParentForNewPerson(undefined);
        }} 
        parentId={parentForNewPerson}
      />
    )}
    </>
  );
};

export default TreeTab;
