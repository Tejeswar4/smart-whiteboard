import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pencil, 
  Eraser, 
  Highlighter, 
  Square, 
  Circle, 
  ArrowUpRight, 
  Minus, 
  Image as ImageIcon, 
  MousePointer2, 
  Sparkles
} from 'lucide-react';
import { Tool } from '../types';

interface LeftSidebarProps {
  currentTool: Tool;
  onSelectTool: (tool: Tool) => void;
  isSmartMode: boolean;
  onToggleSmartMode: () => void;
}

const TOOLS: { id: Tool; icon: any; label: string }[] = [
  { id: 'pointer', icon: MousePointer2, label: 'Select' },
  { id: 'pencil', icon: Pencil, label: 'Pencil' },
  { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'image', icon: ImageIcon, label: 'Insert Image' },
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentTool,
  onSelectTool,
  isSmartMode,
  onToggleSmartMode,
}) => {
  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="fixed left-6 top-1/2 -translate-y-1/2 w-16 hardware-card flex flex-col items-center py-6 space-y-8 z-[100] max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar"
    >
      <div className="flex flex-col space-y-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              currentTool === tool.id 
                ? 'bg-brand-accent text-white' 
                : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/5'
            }`}
            title={tool.label}
          >
            {currentTool === tool.id && (
              <motion.div 
                layoutId="active-tool"
                className="absolute inset-0 bg-brand-accent rounded-xl -z-10 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <tool.icon size={20} strokeWidth={currentTool === tool.id ? 2.5 : 2} />
            <AnimatePresence>
              {currentTool === tool.id && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-1 -top-1 w-2 h-2 bg-white rounded-full border-2 border-brand-accent"
                />
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>

      <div className="w-8 h-px bg-white/5" />

      <button 
        onClick={onToggleSmartMode}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
          isSmartMode ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'text-zinc-600 hover:text-zinc-300'
        }`}
        title="Smart Shape Engine"
      >
        <Sparkles size={20} />
      </button>
    </motion.aside>
  );
};
