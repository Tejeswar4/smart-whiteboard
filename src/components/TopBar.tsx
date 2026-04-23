import React from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  Moon, 
  Sun, 
  Presentation, 
  FolderOpen, 
  Plus, 
  Undo2, 
  Redo2, 
  FileDown, 
  FileUp,
  Cpu
} from 'lucide-react';

interface TopBarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onExport: () => void;
  onSave: () => void;
  onOpen: (file: File) => void;
  boardName: string;
  currentIndex: number;
  totalSlides: number;
  onOpenBoardList: () => void;
  onNewBoard: () => void;
  onAddSlide?: () => void;
  onJumpSlide?: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  layout?: 'infinite' | 'slides';
}

export const TopBar: React.FC<TopBarProps> = ({
  isDarkMode,
  onToggleDarkMode,
  onExport,
  boardName,
  currentIndex,
  totalSlides,
  onOpenBoardList,
  onNewBoard,
  onAddSlide,
  onJumpSlide,
  onUndo,
  onRedo,
  onSave,
  onOpen,
  canUndo,
  canRedo,
  layout
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <motion.header 
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-[64px] immersive-surface flex items-center justify-between px-6 z-[100] border-b border-white/5"
    >
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="bg-brand-accent p-2 rounded-xl text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Cpu size={20} strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-neon-blue rounded-full border-2 border-zinc-950 shadow-[0_0_5px_rgba(0,210,255,0.5)]" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold tracking-tight text-white leading-none">AI Whiteboard</h1>
            <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest leading-none">Engine v2.1.0</p>
          </div>
        </div>

        <div className="w-px h-6 bg-white/10" />

        <motion.div 
          onClick={onOpenBoardList}
          role="button"
          tabIndex={0}
          className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(0,210,255,0.6)] group-hover:scale-125 transition-transform" />
          <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors capitalize">{boardName}</span>
        </motion.div>

        {layout === 'slides' && (
          <div className="flex items-center space-x-2 ml-4">
             <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mr-2">Slide Navigation</div>
             <div className="flex items-center space-x-1 p-1 bg-zinc-900/40 rounded-lg border border-white/5 h-8 w-48">
                <div 
                   className="relative flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden cursor-pointer"
                   onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = x / rect.width;
                      const index = Math.floor(percentage * totalSlides);
                      onJumpSlide?.(index);
                   }}
                >
                   <motion.div 
                      className="absolute top-0 left-0 h-full bg-neon-blue shadow-[0_0_8px_rgba(0,210,255,0.5)]"
                      style={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }}
                   />
                </div>
                <div className="text-[10px] font-mono text-zinc-400 px-2 min-w-12 text-center">
                   {currentIndex + 1} / {totalSlides}
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1 p-1 bg-zinc-900/50 rounded-xl border border-white/5 mr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition-all ${
              canUndo ? 'text-zinc-300 hover:bg-white/10 hover:text-white' : 'text-zinc-800 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition-all ${
              canRedo ? 'text-zinc-300 hover:bg-white/10 hover:text-white' : 'text-zinc-800 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div className="flex items-center space-x-2 bg-zinc-900/50 p-1 rounded-xl border border-white/5">
          <button
            onClick={onOpenBoardList}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <FolderOpen size={14} />
            <span>Boards</span>
          </button>

          <button
            onClick={onNewBoard}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
            title="New Board"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <div className="flex items-center space-x-2 bg-zinc-900/50 p-1 rounded-xl border border-white/5">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onOpen(file);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-all"
            title="Open from file"
          >
            <FileUp size={14} />
          </button>

          <button
            onClick={onSave}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-all"
            title="Save to file"
          >
            <FileDown size={14} />
          </button>
        </div>

        {layout === 'slides' && onAddSlide && (
          <button
            onClick={onAddSlide}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          >
            <Plus size={14} />
            <span>Add Slide</span>
          </button>
        )}

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button
          onClick={onExport}
          className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-brand-accent text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-[0_8px_16px_-4px_rgba(59,130,246,0.5)] active:scale-95"
        >
          <Download size={14} />
          <span>Export</span>
        </button>

        <button
          onClick={onToggleDarkMode}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white transition-all"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </motion.header>
  );
};
