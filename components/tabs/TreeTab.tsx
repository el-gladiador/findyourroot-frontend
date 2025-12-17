import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Heart, Plus, ZoomIn, ZoomOut, Maximize2, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TreeNode from '@/components/TreeNode';
import ExpandedPersonCard from '@/components/ExpandedPersonCard';
import AddPersonModal from '@/components/AddPersonModal';
import { Person, canContribute, canEditDirectly, needsApproval } from '@/lib/types';

// Performance: Throttle function for smooth updates
const throttle = <T extends (...args: unknown[]) => void>(fn: T, ms: number) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
};

const TreeTab = () => {
  const familyData = useAppStore((state) => state.familyData);
  const clearTree = useAppStore((state) => state.clearTree);
  const user = useAppStore((state) => state.user);
  const focusedPersonId = useAppStore((state) => state.focusedPersonId);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [parentForNewPerson, setParentForNewPerson] = useState<string | undefined>(undefined);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Check if user can contribute (contributors and above can use buttons)
  const userCanContribute = user?.role ? canContribute(user.role) : false;
  // Check if user can edit directly (editors and above)
  const userCanEditDirectly = user?.role ? canEditDirectly(user.role) : false;
  // Check if user is contributor (needs approval for changes)
  const isContributor = user?.role ? needsApproval(user.role) : false;
  const canDelete = user?.role === 'admin';
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  
  // Zoom and Pan state - use refs for immediate updates during gestures
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  // Refs for gesture handling (avoid state updates during gestures)
  const gestureState = useRef({
    isPanning: false,
    startPan: { x: 0, y: 0 },
    currentTranslate: { x: 0, y: 0 },
    currentScale: 1,
  });
  
  // Keep refs in sync with state
  useEffect(() => {
    gestureState.current.currentTranslate = translate;
    gestureState.current.currentScale = scale;
  }, [translate, scale]);
  
  const rafId = useRef<number | null>(null);
  
  // Dynamic refs storage
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Lines connecting nodes
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  // Counter to trigger line recalculation when nodes change
  const [nodesRendered, setNodesRendered] = useState(0);
  
  // Find root nodes (nodes with no parents) - recalculate when familyData changes
  const rootNodes = useMemo(() => {
    const allChildIds = new Set(familyData.flatMap(p => p.children));
    return familyData.filter(p => !allChildIds.has(p.id));
  }, [familyData]);
  
  // Get children for a person
  const getChildren = (personId: string) => {
    const person = familyData.find(p => p.id === personId);
    if (!person || !person.children) return [];
    return person.children.map(childId => familyData.find(p => p.id === childId)).filter(Boolean) as Person[];
  };
  
  // Find spouse (someone who shares children but isn't in parent-child relationship)
  const findSpouse = (personId: string) => {
    const person = familyData.find(p => p.id === personId);
    if (!person || !person.children || person.children.length === 0) return null;
    
    return familyData.find(p => 
      p.id !== personId && 
      p.children?.some(childId => person.children.includes(childId))
    ) || null;
  };
  
  const setNodeRef = (id: string) => (el: HTMLDivElement | null) => {
    const hadRef = nodeRefs.current.has(id);
    if (el) {
      nodeRefs.current.set(id, el);
      // Trigger line recalculation when new node is mounted
      if (!hadRef) {
        requestAnimationFrame(() => setNodesRendered(n => n + 1));
      }
    } else {
      nodeRefs.current.delete(id);
      // Trigger line recalculation when node is unmounted
      if (hadRef) {
        requestAnimationFrame(() => setNodesRendered(n => n + 1));
      }
    }
  };

  const handleAddClick = (parentId?: string) => {
    if (!userCanContribute) {
      setPermissionWarning('You need at least Contributor permissions to add family members. Please request permissions from an administrator.');
      setTimeout(() => setPermissionWarning(null), 5000);
      return;
    }
    setParentForNewPerson(parentId);
    setShowAddModal(true);
  };

  // Show success message (e.g., after suggestion is submitted)
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleClearTree = async () => {
    if (!canDelete) {
      setPermissionWarning('Only Administrators can clear the entire tree.');
      setTimeout(() => setPermissionWarning(null), 5000);
      return;
    }
    if (confirm('Are you sure you want to delete all family members? This action cannot be undone.')) {
      await clearTree();
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

  // Focus on a specific person in the tree
  const focusOnPerson = useCallback((personId: string) => {
    const nodeEl = nodeRefs.current.get(personId);
    if (!nodeEl || !containerRef.current || !viewportRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const nodeRect = nodeEl.getBoundingClientRect();
    
    // Calculate node center position in unscaled container coordinates
    const nodeCenterX = (nodeRect.left + nodeRect.width / 2 - containerRect.left) / scale;
    const nodeCenterY = (nodeRect.top + nodeRect.height / 2 - containerRect.top) / scale;
    
    // Calculate container center
    const containerCenterX = (containerRect.width / scale) / 2;
    const containerCenterY = (containerRect.height / scale) / 2;
    
    // Calculate offset from container center to node
    const offsetX = containerCenterX - nodeCenterX;
    const offsetY = containerCenterY - nodeCenterY;
    
    // Set zoom to 1 for clear focus and translate to center the node
    setScale(1);
    setTranslate({ x: offsetX, y: offsetY - 50 }); // Offset up a bit for better view
  }, [scale]);

  // Focus on person when focusedPersonId changes (from TopBar search)
  useEffect(() => {
    if (focusedPersonId && nodeRefs.current.has(focusedPersonId)) {
      setTimeout(() => {
        focusOnPerson(focusedPersonId);
      }, 100);
    }
  }, [focusedPersonId, focusOnPerson]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY / 500;
    const newScale = Math.min(Math.max(scale + delta, 0.3), 1.2);
    setScale(newScale);
  };

  // Optimized: Apply transform directly to DOM without React state update
  const applyTransformToDOM = useCallback((x: number, y: number, s: number) => {
    if (transformRef.current) {
      transformRef.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${s})`;
    }
  }, []);

  // Pan handlers - Optimized for performance
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tree-node-clickable')) return;
    
    gestureState.current.isPanning = true;
    gestureState.current.startPan = { 
      x: e.clientX - gestureState.current.currentTranslate.x, 
      y: e.clientY - gestureState.current.currentTranslate.y 
    };
    setIsPanning(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!gestureState.current.isPanning) return;
    
    const newX = e.clientX - gestureState.current.startPan.x;
    const newY = e.clientY - gestureState.current.startPan.y;
    
    gestureState.current.currentTranslate = { x: newX, y: newY };
    
    // Direct DOM manipulation - no React state update during drag
    applyTransformToDOM(newX, newY, gestureState.current.currentScale);
  };

  const handleMouseUp = () => {
    if (gestureState.current.isPanning) {
      gestureState.current.isPanning = false;
      setIsPanning(false);
      // Sync React state with final position
      setTranslate({ ...gestureState.current.currentTranslate });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if ((e.target as HTMLElement).closest('.tree-node-clickable')) return;
      const touch = e.touches[0];
      
      gestureState.current.isPanning = true;
      gestureState.current.startPan = { 
        x: touch.clientX - gestureState.current.currentTranslate.x, 
        y: touch.clientY - gestureState.current.currentTranslate.y 
      };
      setIsPanning(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && gestureState.current.isPanning) {
      const touch = e.touches[0];
      const newX = touch.clientX - gestureState.current.startPan.x;
      const newY = touch.clientY - gestureState.current.startPan.y;
      
      gestureState.current.currentTranslate = { x: newX, y: newY };
      
      // Direct DOM manipulation - no React state update during drag
      applyTransformToDOM(newX, newY, gestureState.current.currentScale);
    }
  };

  const handleTouchEnd = () => {
    if (gestureState.current.isPanning) {
      gestureState.current.isPanning = false;
      setIsPanning(false);
      // Sync React state with final position
      setTranslate({ ...gestureState.current.currentTranslate });
    }
  };

  // Calculate lines based on node positions within the container
  // Uses offsetLeft/offsetTop for stable positioning that doesn't depend on transforms
  const calculateLines = useCallback(() => {
    if (!containerRef.current) return [];
    
    const newLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    
    const getNodePosition = (personId: string) => {
      const el = nodeRefs.current.get(personId);
      if (!el) return null;
      
      // Find the image element (the circle)
      const img = el.querySelector('img');
      if (!img) return null;
      
      // Use offset-based positioning relative to container
      // This is stable regardless of zoom/pan transforms
      const getOffsetPosition = (element: HTMLElement, container: HTMLElement) => {
        let left = 0;
        let top = 0;
        let current: HTMLElement | null = element;
        
        while (current && current !== container) {
          left += current.offsetLeft;
          top += current.offsetTop;
          current = current.offsetParent as HTMLElement | null;
        }
        
        return { left, top };
      };
      
      const imgPos = getOffsetPosition(img, containerRef.current!);
      const imgWidth = img.offsetWidth || 80;
      const imgHeight = img.offsetHeight || 80;
      
      return {
        x: imgPos.left + imgWidth / 2,
        y: imgPos.top + imgHeight / 2,
        top: imgPos.top,
        bottom: imgPos.top + imgHeight,
        left: imgPos.left,
        right: imgPos.left + imgWidth,
      };
    };
    
    // Draw connections for each person with children
    familyData.forEach(person => {
      if (!person.children || person.children.length === 0) return;
      
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
    
    return newLines;
  }, [familyData, findSpouse, getChildren]);

  // Update lines when familyData changes or nodes are re-rendered
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is updated
    const calculateAfterRender = () => {
      requestAnimationFrame(() => {
        const newLines = calculateLines();
        setLines(newLines);
      });
    };
    
    // Small delay to ensure nodes are fully rendered
    const timer = setTimeout(calculateAfterRender, 50);
    
    return () => clearTimeout(timer);
  }, [familyData, calculateLines, nodesRendered]);

  // Recalculate lines when nodes mount/unmount
  useEffect(() => {
    // Trigger recalculation when component mounts
    const timer = setTimeout(() => {
      setNodesRendered(n => n + 1);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [familyData.length]);

  // Handle resize
  useEffect(() => {
    const handleResize = throttle(() => {
      const newLines = calculateLines();
      setLines(newLines);
    }, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateLines]);

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
              onAddChild={() => handleAddClick(person.id)}
              canEdit={userCanContribute}
              isSelected={selectedPerson?.id === person.id}
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
                  onAddChild={() => handleAddClick(spouse.id)}
                  canEdit={userCanContribute}
                  isSelected={selectedPerson?.id === spouse.id}
                />
              </div>
            </>
          )}
        </div>
        
        {/* Children - Recursively render the full tree */}
        {children.length > 0 && (
          <div className="flex gap-8 justify-center">
            {children.map(child => renderPersonWithFamily(child, generation + 1))}
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
            onClick={() => handleAddClick()}
            disabled={!userCanContribute}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {userCanContribute 
              ? (isContributor ? 'Suggest First Person' : 'Add First Person') 
              : 'View Only - No Edit Permission'}
          </button>
        </div>
        
        {showAddModal && (
          <AddPersonModal 
            onClose={() => { setShowAddModal(false); setParentForNewPerson(undefined); }} 
            parentId={parentForNewPerson}
            onSuccess={showSuccess}
            isContributor={isContributor}
          />
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
        ref={transformRef}
        className="absolute top-1/2 left-1/2 gpu-accelerated"
        style={{
          transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px)) scale(${scale})`,
          transformOrigin: 'center',
          transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      >
        <div ref={containerRef} className="relative flex flex-col items-center gap-8">
          {/* SVG Layer for connections */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ zIndex: 0, minHeight: '100%', overflow: 'visible' }}
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

      {/* Clear Tree Button (Admin only) */}
      {canDelete && (
        <div className="fixed right-6 flex flex-col gap-2 z-50" style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={handleClearTree}
            className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center active:scale-95"
            title="Clear entire tree (Admin only)"
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}

      {/* Permission Warning Toast */}
      {permissionWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2">
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 dark:border-amber-600 text-amber-900 dark:text-amber-200 px-6 py-4 rounded-lg shadow-xl max-w-md">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">Permission Required</h4>
                <p className="text-sm">{permissionWarning}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2">
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 text-green-900 dark:text-green-200 px-6 py-4 rounded-lg shadow-xl max-w-md">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">Success</h4>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    
    {/* Expanded Person Card with Shared Element Transition */}
    <AnimatePresence>
      {selectedPerson && (
        <ExpandedPersonCard 
          person={selectedPerson} 
          onClose={() => setSelectedPerson(null)}
          onEdit={() => {
            // TODO: Implement edit functionality
          }}
          onDelete={() => {
            // TODO: Implement delete functionality
          }}
          onAddChild={() => {
            handleAddClick(selectedPerson.id);
            setSelectedPerson(null);
          }}
          canEdit={userCanContribute}
          isContributor={isContributor}
          onSuccess={showSuccess}
        />
      )}
    </AnimatePresence>

    {/* Add Person Modal */}
    {showAddModal && (
      <AddPersonModal 
        onClose={() => { 
          setShowAddModal(false); 
          setParentForNewPerson(undefined);
        }} 
        parentId={parentForNewPerson}
        onSuccess={showSuccess}
        isContributor={isContributor}
      />
    )}
    </>
  );
};

export default TreeTab;
