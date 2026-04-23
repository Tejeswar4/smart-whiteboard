/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Annotation, SlideData, Tool, WhiteboardState, Point, Board, BoardLayout } from './types';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { CanvasArea } from './components/CanvasArea';
import { Navigation } from './components/Navigation';
import { TopBar } from './components/TopBar';
import { LayersPanel } from './components/LayersPanel';
import { MiniMap } from './components/MiniMap';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { adjustColorBrightness } from './utils/colorUtils';
import { Plus, X, Layout, Maximize2, MoreVertical, Trash2, FolderOpen } from 'lucide-react';

const DEFAULT_BOARD = (id: string, name: string, layout: BoardLayout): Board => ({
  id,
  name,
  layout,
  slides: [{ index: 0, type: 'blank', annotations: [] }],
  currentSlideIndex: 0,
  zoom: 1,
  pan: { x: 0, y: 0 },
  createdAt: Date.now(),
  lastModified: Date.now(),
});

const DEFAULT_STATE: WhiteboardState = {
  currentBoardId: 'default-1',
  boards: [DEFAULT_BOARD('default-1', 'My First Board', 'slides')],
  tool: 'pencil',
  color: '#3B82F6',
  brightness: 1,
  strokeWidth: 3,
  eraserWidth: 40,
  isDarkMode: false,
};

const ASPECT_RATIO = 16 / 9;

export default function App() {
  const [state, setState] = useState<WhiteboardState>(() => {
    const saved = localStorage.getItem('whiteboard-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.boards && Array.isArray(parsed.boards)) {
          return { ...DEFAULT_STATE, ...parsed };
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return DEFAULT_STATE;
  });
  
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [isBoardListOpen, setIsBoardListOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isSmartMode, setIsSmartMode] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });
  const [redoStack, setRedoStack] = useState<Annotation[]>([]);
  const [pendingImagePos, setPendingImagePos] = useState<Point | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentBoard = state.boards.find(b => b.id === state.currentBoardId) || state.boards[0];

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('whiteboard-state', JSON.stringify(state));
    }, 1000); // Debounce save to 1s
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        
        if (currentBoard.layout === 'infinite') {
          // Infinite layout takes full container size
          setDimensions({ width: containerW, height: containerH });
        } else {
          // Slide Layout: Strictly Fixed Resolution (1280x720)
          // We keep the internal dimensions fixed at 720p
          setDimensions({ width: 1280, height: 720 });
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentBoard.layout]);

  const updateCurrentBoard = useCallback((updates: Partial<Board>) => {
    setState(prev => ({
      ...prev,
      boards: prev.boards.map(b => 
        b.id === prev.currentBoardId ? { ...b, ...updates, lastModified: Date.now() } : b
      )
    }));
  }, []);

  const handleAddAnnotation = (ann: Annotation) => {
    const newSlides = [...currentBoard.slides];
    const current = newSlides[currentBoard.currentSlideIndex];
    if (current) {
      current.annotations = [...current.annotations, ann];
      updateCurrentBoard({ slides: newSlides });
      setRedoStack([]); // Clear redo on new action
    }
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<Annotation>) => {
    const newSlides = [...currentBoard.slides];
    const current = newSlides[currentBoard.currentSlideIndex];
    if (current) {
      current.annotations = current.annotations.map(ann => 
        ann.id === id ? { ...ann, ...updates } : ann
      );
      updateCurrentBoard({ slides: newSlides });
    }
  };

  const handleDeleteAnnotation = (id: string) => {
    const newSlides = [...currentBoard.slides];
    const current = newSlides[currentBoard.currentSlideIndex];
    if (current) {
      current.annotations = current.annotations.filter(ann => ann.id !== id);
      updateCurrentBoard({ slides: newSlides });
    }
  };

  const handleUndo = () => {
    const newSlides = [...currentBoard.slides];
    const current = newSlides[currentBoard.currentSlideIndex];
    if (current && current.annotations.length > 0) {
      const removed = current.annotations[current.annotations.length - 1];
      setRedoStack(prev => [...prev, removed]);
      current.annotations = current.annotations.slice(0, -1);
      updateCurrentBoard({ slides: newSlides });
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextAnn = redoStack[redoStack.length - 1];
    const newSlides = [...currentBoard.slides];
    const current = newSlides[currentBoard.currentSlideIndex];
    if (current) {
      current.annotations = [...current.annotations, nextAnn];
      setRedoStack(prev => prev.slice(0, -1));
      updateCurrentBoard({ slides: newSlides });
    }
  };

  const handleReorderAnnotation = (id: string, direction: 'up' | 'down') => {
    const newSlides = [...currentBoard.slides];
    const current = newSlides[currentBoard.currentSlideIndex];
    if (current) {
      const idx = current.annotations.findIndex(a => a.id === id);
      if (idx === -1) return;
      
      const newAnns = [...current.annotations];
      if (direction === 'up' && idx < newAnns.length - 1) {
        [newAnns[idx], newAnns[idx + 1]] = [newAnns[idx + 1], newAnns[idx]];
      } else if (direction === 'down' && idx > 0) {
        [newAnns[idx], newAnns[idx - 1]] = [newAnns[idx - 1], newAnns[idx]];
      }
      current.annotations = newAnns;
      updateCurrentBoard({ slides: newSlides });
    }
  };

  const handleAddBlankPage = () => {
    if (currentBoard.layout === 'infinite') return;
    const newSlides = [...currentBoard.slides];
    newSlides.splice(currentBoard.currentSlideIndex + 1, 0, {
      index: newSlides.length,
      type: 'blank',
      annotations: [],
    });
    updateCurrentBoard({ 
      slides: newSlides, 
      currentSlideIndex: currentBoard.currentSlideIndex + 1 
    });
  };

  const createNewBoard = (name: string, layout: BoardLayout) => {
    const id = `board-${Date.now()}`;
    const newBoard = DEFAULT_BOARD(id, name, layout);
    setState(prev => ({
      ...prev,
      boards: [newBoard, ...prev.boards],
      currentBoardId: id
    }));
    setIsNewBoardModalOpen(false);
    confetti();
  };

  const deleteBoard = (id: string) => {
    if (state.boards.length <= 1) return;
    setState(prev => {
      const remainingBoards = prev.boards.filter(b => b.id !== id);
      return {
        ...prev,
        boards: remainingBoards,
        currentBoardId: id === prev.currentBoardId ? remainingBoards[0].id : prev.currentBoardId
      };
    });
  };

  const handleImageUpload = (file: File, position?: Point) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const id = `img-${Date.now()}`;
        const annotation: Annotation = {
          id,
          type: 'image',
          points: [position || { x: 50, y: 50 }], // Use click position or default
          color: '#000000',
          width: 0,
          opacity: 1,
          imageSrc: src,
          imageDimensions: { width: img.width / 4, height: img.height / 4 }
        };
        handleAddAnnotation(annotation);
        setPendingImagePos(null);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const triggerImageUpload = (pos?: Point) => {
    setPendingImagePos(pos || null);
    fileInputRef.current?.click();
  };

  const exportPDF = async () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [dimensions.width, dimensions.height]
    });

    const whiteboardElement = containerRef.current;
    if (!whiteboardElement) return;

    try {
      alert('Starting high-quality export. Please wait...');

      for (let i = 0; i < currentBoard.slides.length; i++) {
        if (i > 0) doc.addPage();
        updateCurrentBoard({ currentSlideIndex: i });
        await new Promise(resolve => setTimeout(resolve, 300));

        const canvas = await html2canvas(whiteboardElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: currentBoard.layout === 'slides' 
            ? (currentBoard.slides[i].backgroundColor || (state.isDarkMode ? '#0f172a' : '#ffffff'))
            : (currentBoard.backgroundColor || (state.isDarkMode ? '#0f172a' : '#ffffff'))
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', 0, 0, dimensions.width, dimensions.height);
      }
      
      doc.save(`${currentBoard.name}-annotated.pdf`);
      confetti();
    } catch (err) {
      console.error("PDF Export failed", err);
      alert("Failed to export PDF. This can happen with very large boards or cross-origin images.");
    }
  };
  
  const handleSaveBoard = () => {
    const data = JSON.stringify(currentBoard, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentBoard.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenBoard = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const board = JSON.parse(e.target?.result as string);
        // Basic validation
        if (!board.id || !board.name || !board.slides) {
          throw new Error('Invalid board format');
        }
        
        // Create a new unique board from the imported data
        const newBoard: Board = {
          ...board,
          id: `board-${Date.now()}`,
          createdAt: Date.now(),
          lastModified: Date.now()
        };

        setState(prev => ({
          ...prev,
          boards: [newBoard, ...prev.boards],
          currentBoardId: newBoard.id
        }));
        confetti();
      } catch (err) {
        console.error("Failed to parse board file", err);
        alert("Failed to open board file. Please make sure it's a valid whiteboard JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSelectBgColor = (color: string) => {
    if (currentBoard.layout === 'slides') {
      const newSlides = [...currentBoard.slides];
      const current = newSlides[currentBoard.currentSlideIndex];
      if (current) {
        current.backgroundColor = color;
        updateCurrentBoard({ slides: newSlides });
      }
    } else {
      updateCurrentBoard({ backgroundColor: color });
    }
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (currentBoard.layout === 'slides') return;
    
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      updateCurrentBoard({ zoom: Math.max(0.1, currentBoard.zoom + delta) });
    } else {
      updateCurrentBoard({
        pan: { x: currentBoard.pan.x - e.deltaX, y: currentBoard.pan.y - e.deltaY }
      });
    }
  }, [currentBoard]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (currentBoard.layout === 'slides') return;

    if (e.buttons === 4 || (e.buttons === 1 && e.altKey)) {
      updateCurrentBoard({
        pan: { x: currentBoard.pan.x + e.movementX, y: currentBoard.pan.y + e.movementY }
      });
    }
  }, [currentBoard]);

  // Touch Navigation for Mobile/Tablet
  const touchState = useRef<{ lastDist: number; lastCenter: Point | null }>({ lastDist: 0, lastCenter: null });

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (currentBoard.layout === 'slides' || e.touches.length < 2) return;
    
    // Pinch to Zoom & Two-finger Pan
    const t1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const t2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
    
    const dist = Math.sqrt(Math.pow(t2.x - t1.x, 2) + Math.pow(t2.y - t1.y, 2));
    const center = { x: (t1.x + t2.x) / 2, y: (t1.y + t2.y) / 2 };
    
    if (touchState.current.lastDist > 0) {
      const zoomDelta = (dist - touchState.current.lastDist) * 0.01;
      const panDelta = touchState.current.lastCenter 
        ? { x: center.x - touchState.current.lastCenter.x, y: center.y - touchState.current.lastCenter.y }
        : { x: 0, y: 0 };
        
      updateCurrentBoard({ 
        zoom: Math.max(0.1, currentBoard.zoom + zoomDelta),
        pan: { x: currentBoard.pan.x + panDelta.x, y: currentBoard.pan.y + panDelta.y }
      });
    }
    
    touchState.current = { lastDist: dist, lastCenter: center };
  }, [currentBoard]);

  const handleTouchEnd = () => {
    touchState.current = { lastDist: 0, lastCenter: null };
  };

  const currentSlide = currentBoard?.slides?.[currentBoard.currentSlideIndex] || currentBoard?.slides?.[0];

  useEffect(() => {
    setRedoStack([]); // Reset redo on slide/board change
  }, [state.currentBoardId, currentBoard.currentSlideIndex]);

  const adjustedColor = adjustColorBrightness(state.color, state.brightness);

  // Calculate visual scale to fit the fixed-size slide in the container
  const visualScale = currentBoard.layout === 'slides' && containerRef.current
    ? Math.min(
        (containerRef.current.clientWidth - 80) / dimensions.width,
        (containerRef.current.clientHeight - 80) / dimensions.height,
        1
      )
    : 1;

  return (
    <div 
      className={`flex flex-col h-screen overflow-hidden ${state.isDarkMode ? 'dark bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <TopBar 
        isDarkMode={state.isDarkMode} 
        onToggleDarkMode={() => setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }))} 
        onExport={exportPDF}
        boardName={currentBoard.name}
        currentIndex={currentBoard.currentSlideIndex}
        totalSlides={currentBoard.slides.length}
        onOpenBoardList={() => setIsBoardListOpen(true)}
        onNewBoard={() => setIsNewBoardModalOpen(true)}
        onAddSlide={handleAddBlankPage}
        onJumpSlide={(index) => updateCurrentBoard({ currentSlideIndex: Math.min(currentBoard.slides.length - 1, Math.max(0, index)) })}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSaveBoard}
        onOpen={handleOpenBoard}
        canUndo={(currentSlide?.annotations?.length || 0) > 0}
        canRedo={redoStack.length > 0}
        layout={currentBoard.layout}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <LeftSidebar
          currentTool={state.tool}
          onSelectTool={(tool) => setState(prev => ({ ...prev, tool }))}
          isSmartMode={isSmartMode}
          onToggleSmartMode={() => setIsSmartMode(prev => !prev)}
        />

        <RightSidebar
          currentColor={state.color}
          onSelectColor={(color) => setState(prev => ({ ...prev, color }))}
          strokeWidth={state.strokeWidth}
          onSelectWidth={(width) => setState(prev => ({ ...prev, strokeWidth: width }))}
          eraserWidth={state.eraserWidth}
          onSelectEraserWidth={(width) => setState(prev => ({ ...prev, eraserWidth: width }))}
          brightness={state.brightness}
          onSelectBrightness={(brightness) => setState(prev => ({ ...prev, brightness }))}
          currentBgColor={currentBoard.layout === 'slides' ? currentSlide?.backgroundColor : currentBoard.backgroundColor}
          onSelectBgColor={handleSelectBgColor}
          isLayersOpen={isLayersOpen}
          onToggleLayers={() => setIsLayersOpen(prev => !prev)}
        />
        
        <main 
          ref={containerRef} 
          className={`flex-1 relative workspace-dots overflow-hidden transition-colors duration-500 ${currentBoard.layout === 'infinite' ? '' : 'flex items-center justify-center p-12'}`}
          style={{ 
            backgroundColor: currentBoard.layout === 'infinite' 
              ? (currentBoard.backgroundColor || (state.isDarkMode ? '#0f172a' : '#ffffff'))
              : '#18181b' // zinc-900
          }}
        >
          <div 
               id="whiteboard-container"
               className={`overflow-hidden relative transition-all duration-500 ${currentBoard.layout === 'infinite' ? 'w-full h-full' : 'shadow-[0_30px_60px_rgba(0,0,0,0.6)] rounded-[4px]'}`} 
               style={{ 
                 width: currentBoard.layout === 'infinite' ? '100%' : (dimensions.width || 800), 
                 height: currentBoard.layout === 'infinite' ? '100%' : (dimensions.height || 600),
                 transform: currentBoard.layout === 'slides' ? `scale(${visualScale})` : 'none',
                 transformOrigin: 'center',
                 backgroundColor: 'transparent'
               }}>
            <CanvasArea
              tool={state.tool}
              color={adjustedColor}
              strokeWidth={state.strokeWidth}
              annotations={currentSlide?.annotations || []}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              width={dimensions.width}
              height={dimensions.height}
              zoom={currentBoard.layout === 'slides' ? 1 : currentBoard.zoom}
              pan={currentBoard.layout === 'slides' ? { x: 0, y: 0 } : currentBoard.pan}
              isDarkMode={state.isDarkMode}
              backgroundColor={currentBoard.layout === 'slides' ? currentSlide?.backgroundColor : currentBoard.backgroundColor}
              onDeleteAnnotation={handleDeleteAnnotation}
              onImageClick={(pos) => triggerImageUpload(pos)}
              selectedId={selectedId}
              onSelectId={setSelectedId}
              isSmartMode={isSmartMode}
            />
          </div>
        </main>

        <AnimatePresence>
          {isLayersOpen && (
            <LayersPanel 
              annotations={currentSlide?.annotations || []}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={handleDeleteAnnotation}
              onReorder={handleReorderAnnotation}
            />
          )}
        </AnimatePresence>

        {currentBoard.layout === 'infinite' && (
          <MiniMap 
            annotations={currentSlide?.annotations || []}
            width={containerRef.current?.clientWidth || 800}
            height={containerRef.current?.clientHeight || 600}
            zoom={currentBoard.zoom}
            pan={currentBoard.pan}
            isDarkMode={state.isDarkMode}
            onNavigate={(pos) => updateCurrentBoard({ pan: pos })}
          />
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file, pendingImagePos || undefined);
          e.target.value = ''; // Reset for same file re-upload
        }}
      />

      <Navigation 
        currentIndex={currentBoard.currentSlideIndex}
        totalSlides={currentBoard.slides.length}
        onPrev={() => updateCurrentBoard({ currentSlideIndex: Math.max(0, currentBoard.currentSlideIndex - 1) })}
        onNext={() => updateCurrentBoard({ currentSlideIndex: Math.min(currentBoard.slides.length - 1, currentBoard.currentSlideIndex + 1) })}
        onJump={(index) => updateCurrentBoard({ currentSlideIndex: Math.min(currentBoard.slides.length - 1, Math.max(0, index)) })}
        onAddBlank={handleAddBlankPage}
        zoom={currentBoard.zoom}
        onZoomIn={() => {
          if (currentBoard.layout === 'infinite') {
            updateCurrentBoard({ zoom: currentBoard.zoom + 0.1 });
          }
        }}
        onZoomOut={() => {
          if (currentBoard.layout === 'infinite') {
            updateCurrentBoard({ zoom: Math.max(0.1, currentBoard.zoom - 0.1) });
          }
        }}
        strokeWidth={state.strokeWidth}
        tool={state.tool}
        layout={currentBoard.layout}
      />

      {/* New Board Modal */}
      <AnimatePresence>
        {isNewBoardModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md" 
              onClick={() => setIsNewBoardModalOpen(false)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-[520px] bg-zinc-950 p-10 rounded-[32px] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] z-10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-neon-blue to-purple-600" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white leading-tight">Initialize Workspace</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-widest leading-none">Select Architecture</p>
                </div>
                <button onClick={() => setIsNewBoardModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-600 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-600 ml-1">Configuration Name</label>
                  <input 
                    autoFocus
                    id="new-board-name"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-semibold text-white focus:border-neon-blue focus:bg-white/[0.08] outline-none transition-all placeholder:text-zinc-700"
                    placeholder="ENTER WORKSPACE ID..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const name = (e.currentTarget as HTMLInputElement).value || 'Untitled Board';
                        createNewBoard(name, 'slides');
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      const name = (document.getElementById('new-board-name') as HTMLInputElement).value || 'Untitled Board';
                      createNewBoard(name, 'infinite');
                    }}
                    className="relative flex flex-col items-center p-8 bg-zinc-900/50 border border-white/5 rounded-[24px] hover:border-neon-blue/40 hover:bg-neon-blue/5 transition-all group text-center space-y-4"
                  >
                    <div className="p-4 bg-neon-blue/10 text-neon-blue rounded-2xl group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,210,255,0.2)] transition-all">
                      <Maximize2 size={28} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200 group-hover:text-white">Infinite Engine</h3>
                      <p className="text-[9px] text-zinc-600 mt-1 uppercase tracking-[0.15em] group-hover:text-neon-blue transition-colors font-mono">Unbound Workspace</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => {
                      const name = (document.getElementById('new-board-name') as HTMLInputElement).value || 'Untitled Board';
                      createNewBoard(name, 'slides');
                    }}
                    className="relative flex flex-col items-center p-8 bg-zinc-900/50 border border-white/5 rounded-[24px] hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group text-center space-y-4"
                  >
                    <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all">
                      <Layout size={28} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-300 group-hover:text-white">Paginated Array</h3>
                      <p className="text-[9px] text-zinc-600 mt-1 uppercase tracking-[0.15em] group-hover:text-blue-400 transition-colors font-mono">Slide Format</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-white/5">
                <p className="text-[9px] text-center text-zinc-700 font-mono uppercase tracking-[0.3em]">System.initialize(uuid_v4)</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Board List Sidebar/Drawer */}
      <AnimatePresence>
        {isBoardListOpen && (
          <div className="fixed inset-0 z-[1000] flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsBoardListOpen(false)} 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-80 bg-zinc-950 border-l border-white/5 p-8 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <FolderOpen size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-white leading-none">Workspace</h2>
                    <p className="text-[10px] text-zinc-600 font-mono mt-1 uppercase tracking-widest">Active Boards</p>
                  </div>
                </div>
                <button onClick={() => setIsBoardListOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {state.boards.map(board => (
                  <div 
                    key={board.id}
                    onClick={() => {
                      setState(prev => ({ ...prev, currentBoardId: board.id }));
                      setIsBoardListOpen(false);
                    }}
                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                      board.id === state.currentBoardId 
                        ? 'bg-blue-500/10 border-blue-500/30' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {board.id === state.currentBoardId && (
                            <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]" />
                          )}
                          <h3 className={`text-sm font-bold ${board.id === state.currentBoardId ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{board.name}</h3>
                        </div>
                        <div className="flex items-center space-x-3 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                          <span className="flex items-center space-x-1">
                            {board.layout === 'infinite' ? <Maximize2 size={10} /> : <Layout size={10} />}
                            <span>{board.layout}</span>
                          </span>
                          <span>•</span>
                          <span>{board.slides.length} Pages</span>
                        </div>
                      </div>
                      
                      {state.boards.length > 1 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBoard(board.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  setIsBoardListOpen(false);
                  setIsNewBoardModalOpen(true);
                }}
                className="mt-6 flex items-center justify-center space-x-2 w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs transition-all border border-white/5 border-dashed"
              >
                <Plus size={16} />
                <span>Create New Board</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
