import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, ZoomIn, ZoomOut, Save } from 'lucide-react';

interface NavigationProps {
  currentIndex: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
  onAddBlank: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  strokeWidth: number;
  tool: string;
  layout: 'infinite' | 'slides';
}

export const Navigation: React.FC<NavigationProps> = ({
  currentIndex,
  totalSlides,
  onPrev,
  onNext,
  onJump,
  onAddBlank,
  zoom,
  onZoomIn,
  onZoomOut,
  strokeWidth,
  tool,
  layout
}) => {
  return (
    <motion.footer 
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-10 immersive-surface flex items-center justify-between px-6 z-20 text-[10px] font-mono font-medium tracking-wider text-zinc-500 border-t border-white/5"
    >
      <div className="flex items-center space-x-8">
        {layout === 'slides' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="text-zinc-500 hover:text-white disabled:opacity-20 transition-all hover:scale-110"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center space-x-2 tabular-nums bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              <input
                type="number"
                value={(currentIndex ?? 0) + 1}
                onChange={(e) => onJump(parseInt(e.target.value) - 1)}
                className="w-8 text-center bg-transparent focus:text-white outline-none text-zinc-400 font-bold"
                min={1}
                max={totalSlides}
              />
              <span className="opacity-30">/</span>
              <span className="opacity-50 text-zinc-400">{totalSlides}</span>
            </div>

            <button
              onClick={onNext}
              disabled={currentIndex === totalSlides - 1}
              className="text-zinc-500 hover:text-white disabled:opacity-20 transition-all hover:scale-110"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {layout === 'infinite' && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-neon-blue/5 rounded-full border border-neon-blue/20">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(0,210,255,0.6)] animate-pulse" />
            <span className="text-neon-blue font-bold uppercase tracking-[0.2em] text-[9px]">Infinite Engine Active</span>
          </div>
        )}

        <div className="flex items-center space-x-2 text-zinc-600">
          <Save size={12} className="text-emerald-500" />
          <span className="uppercase font-bold tracking-widest">System Cloud Sync OK</span>
        </div>
      </div>

      <div className="flex items-center space-x-8">
        {layout === 'slides' && (
          <button
            onClick={onAddBlank}
            className="flex items-center space-x-2 text-zinc-500 hover:text-white transition-all group"
          >
            <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-colors">
              <Plus size={10} />
            </div>
            <span className="uppercase font-bold tracking-widest">Insert Page</span>
          </button>
        )}

        <div className="flex items-center space-x-4">
          {layout === 'infinite' && (
            <div className="flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <button onClick={onZoomOut} className="text-zinc-500 hover:text-white transition-colors"><ZoomOut size={12} /></button>
              <span className="w-12 text-center text-zinc-300 font-bold tabular-nums">{Math.round(zoom * 100)}%</span>
              <button onClick={onZoomIn} className="text-zinc-500 hover:text-white transition-colors"><ZoomIn size={12} /></button>
            </div>
          )}
          
          <div className="flex items-center space-x-3 px-3 py-1 bg-zinc-900/50 rounded-lg border border-white/5">
            <span className="text-zinc-600 uppercase font-bold tracking-widest">Tool:</span>
            <span className="text-zinc-300 font-bold uppercase">{tool}</span>
            <span className="opacity-20">|</span>
            <span className="text-zinc-600 uppercase font-bold tracking-widest">Stroke:</span>
            <span className="text-zinc-300 font-bold tabular-nums">{strokeWidth}px</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};
