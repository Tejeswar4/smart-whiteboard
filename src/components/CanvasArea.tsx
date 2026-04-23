import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Annotation, Point, SlideData, Tool } from '../types';
import { Trash2, Maximize, Minimize } from 'lucide-react';

interface CanvasAreaProps {
  tool: Tool;
  color: string;
  strokeWidth: number;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation?: (id: string, updates: Partial<Annotation>) => void;
  width: number;
  height: number;
  zoom: number;
  pan: Point;
  isDarkMode: boolean;
  backgroundColor?: string;
  backgroundCanvas?: HTMLCanvasElement | null;
  onDeleteAnnotation?: (id: string) => void;
  onImageClick?: (pos: Point) => void;
  selectedId?: string | null;
  onSelectId?: (id: string | null) => void;
  isSmartMode?: boolean;
}

const imageCache = new Map<string, HTMLImageElement>();

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  tool,
  color,
  strokeWidth,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  width,
  height,
  zoom,
  pan,
  isDarkMode,
  backgroundColor,
  backgroundCanvas,
  onDeleteAnnotation,
  onImageClick,
  selectedId: controlledSelectedId,
  onSelectId,
  isSmartMode = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
  const setSelectedId = (id: string | null) => {
    setInternalSelectedId(id);
    onSelectId?.(id);
  };

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);

  // Smoothing kernel
  const smoothPoints = (points: Point[]) => {
    if (points.length < 3) return points;
    const smoothed = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      smoothed.push({
        x: (points[i - 1].x + points[i].x + points[i + 1].x) / 3,
        y: (points[i - 1].y + points[i].y + points[i + 1].y) / 3,
        p: (points[i - 1].p! + points[i].p! + points[i + 1].p!) / 3,
        tx: (points[i - 1].tx! + points[i].tx! + points[i + 1].tx!) / 3,
        ty: (points[i - 1].ty! + points[i].ty! + points[i + 1].ty!) / 3,
      });
    }
    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

  // Basic Shape Recognition
  const recognizeShape = (points: Point[]): { type: Tool, points: Point[] } | null => {
    if (points.length < 20) return null; // Too short to recognize

    const first = points[0];
    const last = points[points.length - 1];
    const dist = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2));
    
    // Check if it's a closed-ish loop (Circle or Rect)
    const isClosed = dist < 50;
    
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    const width = maxX - minX;
    const height = maxY - minY;

    if (isClosed) {
      // Very crude heuristic: check aspect ratio and "filling" of the bounding box
      // For a better implementation we'd check curvature or use a proper geometric fit
      const rectPoints = [{ x: minX, y: minY }, { x: maxX, y: maxY }];
      
      // If it looks somewhat rectangular (many points near edges)
      // For now, let's just use the bounding box to offer a snap
      return { type: 'rect', points: rectPoints };
    }

    return null;
  };

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw annotations
    annotations.forEach(ann => {
      drawAnnotation(ctx, ann);
      if (ann.id === selectedId && ann.type === 'image') {
        drawSelectionBox(ctx, ann);
      }
    });

    if (currentPath.length > 0 && tool !== 'image' && tool !== 'pointer') {
      drawAnnotation(ctx, {
        id: 'current',
        type: tool,
        points: currentPath,
        color,
        width: strokeWidth,
        opacity: tool === 'highlighter' ? 0.3 : 1
      });
    }

    ctx.restore();
  }, [annotations, currentPath, zoom, pan, tool, color, strokeWidth, selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }
    drawAll();
  }, [width, height, drawAll]);

  const drawSelectionBox = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    const pos = ann.points[0];
    let dims = ann.imageDimensions || { width: 100, height: 100 };
    
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5, 5] );
    ctx.strokeRect(pos.x - 2, pos.y - 2, dims.width + 4, dims.height + 4);
    ctx.setLineDash([]);

    // Resize handles: nw, n, ne, e, se, s, sw, w
    ctx.fillStyle = '#3B82F6';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1 / zoom;
    const handleSize = 10 / zoom;

    const handles = [
      { x: pos.x, y: pos.y }, // nw
      { x: pos.x + dims.width / 2, y: pos.y }, // n
      { x: pos.x + dims.width, y: pos.y }, // ne
      { x: pos.x + dims.width, y: pos.y + dims.height / 2 }, // e
      { x: pos.x + dims.width, y: pos.y + dims.height }, // se
      { x: pos.x + dims.width / 2, y: pos.y + dims.height }, // s
      { x: pos.x, y: pos.y + dims.height }, // sw
      { x: pos.x, y: pos.y + dims.height / 2 }, // w
    ];

    handles.forEach(h => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, handleSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  };

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    ctx.save();
    if (ann.type === 'image' && ann.imageSrc) {
      let img = imageCache.get(ann.imageSrc);
      if (!img) {
        img = new Image();
        img.src = ann.imageSrc;
        img.onload = () => {
          imageCache.set(ann.imageSrc!, img!);
          drawAll();
        };
        ctx.restore();
        return;
      }
      
      const pos = ann.points[0];
      const dims = ann.imageDimensions || { width: 100, height: 100 };
      ctx.drawImage(img, pos.x, pos.y, dims.width, dims.height);
      ctx.restore();
      return;
    }

    if (ann.points.length < 2) {
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = ann.width;
    ctx.globalAlpha = ann.opacity;

    if (ann.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    const [first] = ann.points;
    
    if (ann.type === 'rect') {
      const last = ann.points[ann.points.length - 1];
      ctx.strokeRect(first.x, first.y, last.x - first.x, last.y - first.y);
    } else if (ann.type === 'circle') {
      const last = ann.points[ann.points.length - 1];
      const rx = (last.x - first.x) / 2;
      const ry = (last.y - first.y) / 2;
      const cx = first.x + rx;
      const cy = first.y + ry;
      ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ann.type === 'line' || ann.type === 'arrow') {
      const last = ann.points[ann.points.length - 1];
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      if (ann.type === 'arrow') {
        const angle = Math.atan2(last.y - first.y, last.x - first.x);
        const r = ann.width * 3;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(last.x - r * Math.cos(angle - Math.PI / 6), last.y - r * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(last.x - r * Math.cos(angle + Math.PI / 6), last.y - r * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.moveTo(first.x, first.y);
      if ((ann.type === 'pencil' || ann.type === 'highlighter' || ann.type === 'eraser') && ann.points.some(p => p.p !== undefined)) {
        // Variable width rendering
        for (let i = 1; i < ann.points.length; i++) {
          const p1 = ann.points[i - 1];
          const p2 = ann.points[i];
          const pressure = p2.p ?? 1;
          
          ctx.beginPath();
          ctx.lineWidth = ann.width * pressure;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      } else {
        ann.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const getPointerPos = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Safety check for valid rect dimensions
    const rectW = Math.max(rect.width, 1);
    const rectH = Math.max(rect.height, 1);
    
    // Account for CSS scaling (visualScale)
    const scaleX = width / rectW;
    const scaleY = height / rectH;
    
    return {
      x: ((e.clientX - rect.left) * scaleX - pan.x) / zoom,
      y: ((e.clientY - rect.top) * scaleY - pan.y) / zoom,
      p: e.pointerType === 'pen' ? (e.pressure || 0.5) : 1,
      tx: e.tiltX,
      ty: e.tiltY
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) return;
    
    // Don't deselect if clicking on floating controls
    if ((e.target as HTMLElement).closest('.image-controls')) return;

    const canvas = canvasRef.current;
    if (canvas) canvas.setPointerCapture(e.pointerId);

    const pos = getPointerPos(e);
    
    if (tool === 'image') {
      onImageClick?.(pos);
      return;
    }
    
    if (tool === 'pointer') {
      // Check for resize handle first if an image is selected
      if (selectedId) {
        const selected = annotations.find(a => a.id === selectedId);
        if (selected && selected.type === 'image') {
          const imgPos = selected.points[0];
          let dims = selected.imageDimensions || { width: 100, height: 100 };

          const handleDetectionSize = 14 / zoom;

          const handles: { id: typeof dragMode; x: number; y: number }[] = [
            { id: 'nw', x: imgPos.x, y: imgPos.y },
            { id: 'n', x: imgPos.x + dims.width / 2, y: imgPos.y },
            { id: 'ne', x: imgPos.x + dims.width, y: imgPos.y },
            { id: 'e', x: imgPos.x + dims.width, y: imgPos.y + dims.height / 2 },
            { id: 'se', x: imgPos.x + dims.width, y: imgPos.y + dims.height },
            { id: 's', x: imgPos.x + dims.width / 2, y: imgPos.y + dims.height },
            { id: 'sw', x: imgPos.x, y: imgPos.y + dims.height },
            { id: 'w', x: imgPos.x, y: imgPos.y + dims.height / 2 },
          ];

          for (const h of handles) {
            if (Math.abs(pos.x - h.x) < handleDetectionSize && Math.abs(pos.y - h.y) < handleDetectionSize) {
              setDragMode(h.id);
              setDragStart(pos);
              return;
            }
          }
        }
      }

      // Check for selection
      const clicked = [...annotations].reverse().find(ann => {
        if (ann.points.length === 0) return false;
        const p = ann.points[0];

        if (ann.type === 'image') {
          const d = ann.imageDimensions || { width: 100, height: 100 };
          return pos.x >= p.x && pos.x <= p.x + d.width && pos.y >= p.y && pos.y <= p.y + d.height;
        }
        
        // Basic selection for other objects (bounding box)
        const minX = Math.min(...ann.points.map(p => p.x));
        const maxX = Math.max(...ann.points.map(p => p.x));
        const minY = Math.min(...ann.points.map(p => p.y));
        const maxY = Math.max(...ann.points.map(p => p.y));
        
        // Add a small padding for easier selection
        const pad = (ann.width || 5) / 2 + 10 / zoom;
        return pos.x >= minX - pad && pos.x <= maxX + pad && pos.y >= minY - pad && pos.y <= maxY + pad;
      });

      if (clicked) {
        setSelectedId(clicked.id);
        setDragMode('move');
        setDragStart(pos);
      } else {
        setSelectedId(null);
      }
      return;
    }

    setIsDrawing(true);
    setCurrentPath([pos]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDrawing || dragMode) {
      e.preventDefault();
    }
    const pos = getPointerPos(e);

    if (dragMode && selectedId && dragStart) {
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      const ann = annotations.find(a => a.id === selectedId);
      if (!ann) {
        setDragMode(null);
        setSelectedId(null);
        return;
      }
      const imgPos = ann.points[0];
      const dims = ann.imageDimensions || { width: 100, height: 100 };
      
      if (dragMode === 'move') {
        onUpdateAnnotation?.(selectedId, {
          points: [{ x: imgPos.x + dx, y: imgPos.y + dy }]
        });
      } else {
        let newX = imgPos.x;
        let newY = imgPos.y;
        let newW = dims.width;
        let newH = dims.height;

        if (dragMode.includes('e')) newW = Math.max(20, dims.width + dx);
          if (dragMode.includes('w')) {
            const delta = Math.min(dims.width - 20, dx);
            newX += delta;
            newW -= delta;
          }
          if (dragMode.includes('s')) newH = Math.max(20, dims.height + dy);
          if (dragMode.includes('n')) {
            const delta = Math.min(dims.height - 20, dy);
            newY += delta;
            newH -= delta;
          }

          onUpdateAnnotation?.(selectedId, {
            points: [{ x: newX, y: newY }],
            imageDimensions: { width: newW, height: newH }
          });
        }
        setDragStart(pos);
        return;
      }

    if (isDrawing) {
      setCurrentPath(prev => [...prev, pos]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (canvas) canvas.releasePointerCapture(e.pointerId);

    setDragMode(null);
    setDragStart(null);
    
    if (isDrawing) {
      setIsDrawing(false);
      if (currentPath.length > 1) {
        let finalPath = currentPath;
        let finalTool = tool;
        
        if (tool === 'pencil' || tool === 'highlighter') {
          finalPath = smoothPoints(currentPath);
          
          if (isSmartMode) {
            const recognized = recognizeShape(finalPath);
            if (recognized) {
              finalTool = recognized.type;
              finalPath = recognized.points;
            }
          }
        }

        onAddAnnotation({
          id: Math.random().toString(36).substr(2, 9),
          type: finalTool,
          points: finalPath,
          color: tool === 'eraser' ? 'rgba(0,0,0,1)' : color,
          width: strokeWidth,
          opacity: tool === 'highlighter' ? 0.3 : 1
        });
      }
      setCurrentPath([]);
    }
  };

  const selectedAnnotation = annotations.find(a => a.id === selectedId && a.type === 'image');

  return (
    <div className="relative shadow-inner w-full h-full overflow-hidden" 
         style={{ width, height, backgroundColor: backgroundColor || (isDarkMode ? '#0f172a' : '#ffffff') }}>
      
      {/* Floating Controls for selected image */}
      {selectedAnnotation && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute z-50 flex items-center bg-zinc-950 border border-white/10 rounded-xl p-2 shadow-[0_10px_25px_-5px_rgba(0,0,0,1)] space-x-1 image-controls"
          style={{ 
            left: (selectedAnnotation.points[0].x * zoom + pan.x),
            top: (selectedAnnotation.points[0].y * zoom + pan.y - 60),
            transform: 'translateX(-50%)' // Center above the image
          }}
        >
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950 border-r border-b border-white/10 rotate-45" />
          
          <button 
            onClick={() => {
              const dims = selectedAnnotation.imageDimensions || { width: 100, height: 100 };
              onUpdateAnnotation?.(selectedId!, {
                imageDimensions: { width: dims.width * 1.1, height: dims.height * 1.1 }
              });
            }}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all active:scale-90"
            title="Scale Up"
          >
            <Maximize size={16} />
          </button>
          
          <button 
            onClick={() => {
              const dims = selectedAnnotation.imageDimensions || { width: 100, height: 100 };
              onUpdateAnnotation?.(selectedId!, {
                imageDimensions: { width: dims.width * 0.9, height: dims.height * 0.9 }
              });
            }}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all active:scale-90"
            title="Scale Down"
          >
            <Minimize size={16} />
          </button>
          
          <div className="w-px h-4 bg-white/5 mx-1" />
          
          <button 
            onClick={() => {
              onDeleteAnnotation?.(selectedId!);
              setSelectedId(null);
            }}
            className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 transition-all active:scale-90"
            title="Remove Component"
          >
            <Trash2 size={16} />
          </button>
        </motion.div>
      )}

      {backgroundCanvas && (
        <canvas
          className="absolute inset-0 pointer-events-none"
          ref={el => {
            if (el && backgroundCanvas) {
              const ctx = el.getContext('2d');
              if (ctx) {
                el.width = width;
                el.height = height;
                ctx.clearRect(0, 0, width, height);
                ctx.save();
                ctx.translate(pan.x, pan.y);
                ctx.scale(zoom, zoom);
                
                // Draw slide centered
                const sScale = Math.min(width / backgroundCanvas.width, height / backgroundCanvas.height) * 0.9;
                const dx = (width / zoom - backgroundCanvas.width * sScale) / 2;
                const dy = (height / zoom - backgroundCanvas.height * sScale) / 2;
                
                ctx.drawImage(backgroundCanvas, dx, dy, backgroundCanvas.width * sScale, backgroundCanvas.height * sScale);
                ctx.restore();
              }
            }
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`absolute inset-0 z-20 touch-none ${tool === 'image' ? 'cursor-copy' : 'cursor-crosshair'}`}
        style={{ cursor: tool === 'pointer' ? 'default' : (tool === 'image' ? 'copy' : 'crosshair') }}
      />
    </div>
  );
};
