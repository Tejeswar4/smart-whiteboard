import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Pipette,
  Layers,
  Palette,
  Eraser
} from 'lucide-react';

interface RightSidebarProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  strokeWidth: number;
  onSelectWidth: (width: number) => void;
  eraserWidth: number;
  onSelectEraserWidth: (width: number) => void;
  brightness: number;
  onSelectBrightness: (brightness: number) => void;
  currentBgColor?: string;
  onSelectBgColor: (color: string) => void;
  isLayersOpen: boolean;
  onToggleLayers: () => void;
}

const COLORS = ['#000000', '#EF4444', '#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
const BG_COLORS = ['#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0', '#0F172A', '#1E293B', '#334155'];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  currentColor,
  onSelectColor,
  strokeWidth,
  onSelectWidth,
  eraserWidth,
  onSelectEraserWidth,
  brightness,
  onSelectBrightness,
  currentBgColor,
  onSelectBgColor,
  isLayersOpen,
  onToggleLayers,
}) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const bgColorInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.aside 
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="fixed right-6 top-1/2 -translate-y-1/2 w-20 hardware-card flex flex-col items-center py-6 space-y-6 z-[100] max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar"
    >
      <section className="flex flex-col items-center space-y-3">
        <div className="p-2 bg-zinc-900/50 rounded-lg border border-white/5 flex items-center justify-center text-zinc-600">
          <Palette size={14} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onSelectColor(color)}
              className={`w-5 h-5 rounded-full border border-white/10 transition-all hover:scale-110 ${
                currentColor === color ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-zinc-900 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="relative group">
            <input 
              type="color" 
              ref={colorInputRef} 
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
              value={currentColor}
              onChange={(e) => onSelectColor(e.target.value)}
            />
            <button
              className={`w-5 h-5 rounded-full border border-white/10 flex items-center justify-center bg-zinc-800 transition-all hover:scale-110 ${
                !COLORS.includes(currentColor) ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-zinc-900 scale-110' : ''
              }`}
              onClick={() => colorInputRef.current?.click()}
            >
              <Pipette size={10} className="text-zinc-500 group-hover:text-zinc-300" />
            </button>
          </div>
        </div>
      </section>

      <div className="w-10 h-px bg-white/5" />

      <section className="flex flex-col items-center space-y-3">
        <div className="p-2 bg-zinc-900/50 rounded-lg border border-white/5 flex items-center justify-center text-zinc-600">
          <Layers size={14} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BG_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onSelectBgColor(color)}
              className={`w-5 h-5 rounded-full border border-white/10 transition-all hover:scale-110 ${
                currentBgColor === color ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-zinc-900 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="relative group">
            <input 
              type="color" 
              ref={bgColorInputRef} 
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
              value={currentBgColor || '#ffffff'}
              onChange={(e) => onSelectBgColor(e.target.value)}
            />
            <button
              className={`w-5 h-5 rounded-full border border-white/10 flex items-center justify-center bg-zinc-800 transition-all hover:scale-110 ${
                currentBgColor && !BG_COLORS.includes(currentBgColor) ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-zinc-900 scale-110' : ''
              }`}
              onClick={() => bgColorInputRef.current?.click()}
            >
              <Pipette size={10} className="text-zinc-500 group-hover:text-zinc-300" />
            </button>
          </div>
        </div>
      </section>

      <div className="w-10 h-px bg-white/5" />

      <div className="flex flex-col items-center group">
        <div className="w-7 h-7 flex items-center justify-center bg-zinc-900 rounded-lg border border-white/5 mb-3">
          <div 
            className="bg-brand-accent rounded-full" 
            style={{ 
              width: Math.max(2, Math.min(strokeWidth / 2, 20)), 
              height: Math.max(2, Math.min(strokeWidth / 2, 20))
            }}
          />
        </div>
        <div className="relative h-16 flex items-center">
          <input
            type="range"
            min="1"
            max="60"
            value={strokeWidth}
            onChange={(e) => onSelectWidth(parseInt(e.target.value))}
            className="appearance-none bg-zinc-800 h-1 w-16 rounded-full accent-brand-accent cursor-pointer -rotate-90 origin-center absolute left-1/2 -translate-x-1/2"
          />
        </div>
        <span className="text-[9px] font-mono text-zinc-600 mt-10">STROKE</span>
      </div>

      <div className="flex flex-col items-center group mt-4">
        <div className="w-7 h-7 flex items-center justify-center bg-zinc-900 rounded-lg border border-white/5 mb-3">
          <Eraser size={14} className="text-zinc-500" />
        </div>
        <div className="relative h-16 flex items-center">
          <input
            type="range"
            min="5"
            max="200"
            value={eraserWidth}
            onChange={(e) => onSelectEraserWidth(parseInt(e.target.value))}
            className="appearance-none bg-zinc-800 h-1 w-16 rounded-full accent-red-500 cursor-pointer -rotate-90 origin-center absolute left-1/2 -translate-x-1/2"
          />
        </div>
        <span className="text-[9px] font-mono text-zinc-600 mt-10 uppercase">Eraser</span>
      </div>

      <div className="w-10 h-px bg-white/5" />

      <div className="flex flex-col items-center">
        <div className="relative h-16 flex items-center">
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={brightness}
            onChange={(e) => onSelectBrightness(parseFloat(e.target.value))}
            className="appearance-none bg-zinc-800 h-1 w-16 rounded-full accent-zinc-500 cursor-pointer -rotate-90 origin-center absolute left-1/2 -translate-x-1/2"
          />
        </div>
        <span className="text-[9px] font-mono text-zinc-600 mt-10 uppercase">Shade</span>
      </div>

      <div className="w-10 h-px bg-white/5" />

      <button 
        onClick={onToggleLayers}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
          isLayersOpen ? 'bg-zinc-800 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Layers size={20} />
      </button>
    </motion.aside>
  );
};
