export type Tool = 'pencil' | 'eraser' | 'highlighter' | 'rect' | 'circle' | 'arrow' | 'line' | 'image' | 'pointer';

export type BoardLayout = 'infinite' | 'slides';

export interface Point {
  x: number;
  y: number;
  p?: number; // Pressure (0-1)
  tx?: number; // Tilt X
  ty?: number; // Tilt Y
}

export interface Annotation {
  id: string;
  type: Tool;
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  imageSrc?: string;
  imageDimensions?: { width: number; height: number };
}
export interface SlideData {
  index: number;
  type: 'slide' | 'blank';
  annotations: Annotation[];
  backgroundColor?: string;
}

export interface Board {
  id: string;
  name: string;
  layout: BoardLayout;
  slides: SlideData[];
  currentSlideIndex: number;
  zoom: number;
  pan: Point;
  createdAt: number;
  lastModified: number;
  backgroundColor?: string;
}

export interface WhiteboardState {
  currentBoardId: string;
  boards: Board[];
  tool: Tool;
  color: string;
  brightness: number;
  strokeWidth: number;
  eraserWidth: number;
  isDarkMode: boolean;
}
