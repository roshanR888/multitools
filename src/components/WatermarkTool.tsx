import React, { useState, useRef, useEffect } from 'react';
import { Download, Type, Square, Plus, Trash2, RotateCcw } from 'lucide-react';
import Dropzone from './Dropzone';
import { fileToDataUrl, downloadBlob, cn, dataUrlToBlob } from '../lib/utils';
import confetti from 'canvas-confetti';

interface Watermark {
  id: number;
  text: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  fontSize: number;
}

export default function WatermarkTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [watermarks, setWatermarks] = useState<Watermark[]>([
    { id: Date.now(), text: 'imagemb2kb.com', x: 0.5, y: 0.5, rotation: 0, opacity: 50, fontSize: 40 }
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setSourceImage(await fileToDataUrl(file));
  };

  const addWatermark = () => {
    if (watermarks.length >= 5) return;
    const newWm: Watermark = {
      id: Date.now(),
      text: 'Watermark ' + (watermarks.length + 1),
      x: 0.5,
      y: 0.5,
      rotation: 0,
      opacity: 50,
      fontSize: 50
    };
    setWatermarks([...watermarks, newWm]);
    setActiveIndex(watermarks.length);
  };

  const removeWatermark = (index: number) => {
    if (watermarks.length <= 1) return;
    const newWms = watermarks.filter((_, i) => i !== index);
    setWatermarks(newWms);
    setActiveIndex(Math.max(0, activeIndex - 1));
  };

  const updateActive = (updates: Partial<Watermark>) => {
    const newWms = [...watermarks];
    newWms[activeIndex] = { ...newWms[activeIndex], ...updates };
    setWatermarks(newWms);
  };

  const draw = () => {
    if (!sourceImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.src = sourceImage;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      watermarks.forEach((wm) => {
        ctx.save();
        ctx.globalAlpha = wm.opacity / 100;
        
        const baseFontSize = canvas.width / 20;
        const actualFontSize = (wm.fontSize / 100) * baseFontSize * 2;
        
        ctx.font = `bold ${actualFontSize}px Inter`;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = actualFontSize / 15;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = wm.x * canvas.width;
        const y = wm.y * canvas.height;
        
        ctx.translate(x, y);
        ctx.rotate((wm.rotation * Math.PI) / 180);
        
        ctx.strokeText(wm.text, 0, 0);
        ctx.fillText(wm.text, 0, 0);
        
        ctx.restore();
      });
      
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9));
    };
  };

  useEffect(() => {
    draw();
  }, [sourceImage, watermarks]);

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragPosition = (clientX: number, clientY: number) => {
    if (!sourceImage || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate relative position (0 to 1)
    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;
    
    // Clamp values
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    
    updateActive({ x, y });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleDragPosition(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleDragPosition(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleDragPosition(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleDragPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const currentwm = watermarks[activeIndex];

  return (
    <div className="space-y-6">
      {!sourceImage ? (
        <Dropzone onFiles={handleFiles} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-900 dark:text-white">
          <div className="lg:col-span-2 space-y-4">
             <div 
               ref={containerRef}
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onTouchStart={handleTouchStart}
               onTouchMove={handleTouchMove}
               onTouchEnd={handleTouchEnd}
               className="glass-card rounded-3xl overflow-hidden bg-slate-900 border-none aspect-video flex items-center justify-center cursor-move relative group touch-none"
             >
               {previewUrl && <img src={previewUrl} className="max-w-full max-h-full object-contain pointer-events-none" />}
               <canvas ref={canvasRef} className="hidden" />
               <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                 Drag to reposition active watermark
               </div>
             </div>
             
             <div className="flex gap-2 overflow-x-auto pb-2">
               {watermarks.map((wm, i) => (
                 <button
                   key={wm.id}
                   onClick={() => setActiveIndex(i)}
                   className={cn(
                     "px-4 py-2 rounded-xl border text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                     activeIndex === i ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-900 text-slate-500"
                   )}
                 >
                   <Type size={14} />
                   WM {i + 1}
                 </button>
               ))}
               {watermarks.length < 5 && (
                 <button 
                   onClick={addWatermark}
                   className="px-4 py-2 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all"
                 >
                   <Plus size={16} />
                 </button>
               )}
             </div>
          </div>
          
          <div className="space-y-4">
            <div className="glass-card space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Settings: WM {activeIndex + 1}</h3>
                {watermarks.length > 1 && (
                  <button onClick={() => removeWatermark(activeIndex)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Text</label>
                <input 
                  type="text" 
                  value={currentwm.text}
                  onChange={(e) => updateActive({ text: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 ring-blue-500 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase">Opacity</label>
                    <span className="text-[10px] font-bold text-blue-500">{currentwm.opacity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" max="100" 
                    value={currentwm.opacity} 
                    onChange={(e) => updateActive({ opacity: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase">Rotation</label>
                    <span className="text-[10px] font-bold text-blue-500">{currentwm.rotation}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="-180" max="180" 
                    value={currentwm.rotation} 
                    onChange={(e) => updateActive({ rotation: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">Font Size</label>
                  <span className="text-[10px] font-bold text-blue-500">{currentwm.fontSize}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" max="200" 
                  value={currentwm.fontSize} 
                  onChange={(e) => updateActive({ fontSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            <button
               onClick={async () => {
                 const blob = await dataUrlToBlob(previewUrl!);
                 downloadBlob(blob, 'watermarked.jpg');
                 confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
               }}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Download size={20} />
              Download Result
            </button>
            
            <button
              onClick={() => setSourceImage(null)}
              className="w-full glass-card !py-3 font-bold text-slate-500"
            >
              Reset All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
