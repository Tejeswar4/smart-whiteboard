import React, { useEffect, useRef } from 'react';
import { Annotation, Point } from '../types';
import { motion } from 'motion/react';

interface MiniMapProps {
  annotations: Annotation[];
  width: number;
  height: number;
  zoom: number;
  pan: Point;
  onNavigate?: (pos: Point) => void;
  isDarkMode: boolean;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  annotations,
  width,
  height,
  zoom,
  pan,
  onNavigate,
  isDarkMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const getBounds = () => {
    if (annotations.length === 0) return { minX: 0, minY: 0, maxX: width, maxY: height };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    annotations.forEach(ann => {
      ann.points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
      
      if (ann.type === 'image' && ann.imageDimensions) {
        const p = ann.points[0];
        maxX = Math.max(maxX, p.x + ann.imageDimensions.width);
        maxY = Math.max(maxY, p.y + ann.imageDimensions.height);
      }
    });
    
    const padding = 100;
    return {
      minX: Math.min(minX - padding, 0),
      minY: Math.min(minY - padding, 0),
      maxX: Math.max(maxX + padding, width),
      maxY: Math.max(maxY + padding, height)
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bounds = getBounds();
    const boundsWidth = bounds.maxX - bounds.minX;
    const boundsHeight = bounds.maxY - bounds.minY;
    
    const scale = Math.min(160 / boundsWidth, 120 / boundsHeight);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const viewportX = (-pan.x / zoom - bounds.minX) * scale;
    const viewportY = (-pan.y / zoom - bounds.minY) * scale;
    const viewportW = (width / zoom) * scale;
    const viewportH = (height / zoom) * scale;

    ctx.fillStyle = isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.fillRect(viewportX, viewportY, viewportW, viewportH);
    ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);

    ctx.translate(-bounds.minX * scale, -bounds.minY * scale);
    
    annotations.forEach(ann => {
      ctx.beginPath();
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = Math.max(1, (ann.width * scale) / zoom);
      ctx.globalAlpha = ann.opacity;

      if (ann.type === 'pencil' || ann.type === 'highlighter' || ann.type === 'line' || ann.type === 'pointer') {
         if (ann.points.length < 2) return;
         ctx.moveTo(ann.points[0].x * scale, ann.points[0].y * scale);
         ann.points.slice(1).forEach(p => ctx.lineTo(p.x * scale, p.y * scale));
         ctx.stroke();
      } else if (ann.type === 'rect') {
        const p1 = ann.points[0];
        const p2 = ann.points[1];
        if (p1 && p2) ctx.strokeRect(p1.x * scale, p1.y * scale, (p2.x - p1.x) * scale, (p2.y - p1.y) * scale);
      } else if (ann.type === 'circle') {
        const p1 = ann.points[0];
        const p2 = ann.points[1];
        if (p1 && p2) {
          const rx = Math.abs(p2.x - p1.x) / 2;
          const ry = Math.abs(p2.y - p1.y) / 2;
          ctx.beginPath();
          ctx.ellipse((p1.x + p2.x) / 2 * scale, (p1.y + p2.y) / 2 * scale, rx * scale, ry * scale, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (ann.type === 'image') {
          ctx.fillStyle = isDarkMode ? '#1e293b' : '#e2e8f0';
          const p = ann.points[0];
          const dims = ann.imageDimensions || { width: 100, height: 100 };
          ctx.fillRect(p.x * scale, p.y * scale, dims.width * scale, dims.height * scale);
      }
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [annotations, width, height, zoom, pan, isDarkMode]);

  const handleInteract = (e: React.MouseEvent) => {
    if (!onNavigate) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const bounds = getBounds();
    const scale = Math.min(160 / (bounds.maxX - bounds.minX), 120 / (bounds.maxY - bounds.minY));
    
    const targetX = (x / scale + bounds.minX);
    const targetY = (y / scale + bounds.minY);
    
    onNavigate({ x: -targetX * zoom + width / 2, y: -targetY * zoom + height / 2 });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-14 right-6 w-40 h-30 hardware-card overflow-hidden z-[100] cursor-crosshair group"
      onClick={handleInteract}
    >
      <div className="absolute top-2 left-2 flex items-center space-x-1.5 z-10">
        <div className="w-1.5 h-1.5 rounded-full bg-neon-blue shadow-[0_0_5px_rgba(0,210,255,0.5)]" />
        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Navigation Radar</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={160} 
        height={120} 
        className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
      />
    </motion.div>
  );
};
