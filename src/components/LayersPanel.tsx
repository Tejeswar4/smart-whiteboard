import React from 'react';
import { Annotation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Trash2, Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown } from 'lucide-react';

interface LayersPanelProps {
  annotations: Annotation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  annotations,
  selectedId,
  onSelect,
  onDelete,
  onReorder
}) => {
  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed right-6 top-24 w-60 hardware-card flex flex-col z-[100] max-h-[60vh]"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers size={14} className="text-zinc-500" />
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Layer Stack</h3>
        </div>
        <span className="text-[9px] font-mono text-zinc-600">{annotations.length} Objects</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {annotations.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Stage Empty</p>
          </div>
        ) : (
          [...annotations].reverse().map((ann, idx) => {
            const actualIdx = annotations.length - 1 - idx;
            const isSelected = selectedId === ann.id;
            
            return (
              <div 
                key={ann.id}
                onClick={() => onSelect(isSelected ? null : ann.id)}
                className={`group flex items-center justify-between p-2 rounded-lg transition-all border ${
                  isSelected ? 'bg-blue-500/10 border-blue-500/20' : 'bg-transparent border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div 
                    className="w-1.5 h-6 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: ann.color }}
                  />
                  <div className="overflow-hidden">
                    <p className={`text-[10px] font-bold truncate leading-none ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                      {ann.type.toUpperCase()}
                    </p>
                    <p className="text-[8px] font-mono text-zinc-700 mt-1 truncate">ID: {ann.id.slice(0, 6)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onReorder(ann.id, 'up'); }}
                    className="p-1 hover:text-white text-zinc-600"
                    title="Move Up"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }}
                    className="p-1 hover:text-red-500 text-zinc-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
