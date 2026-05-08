import React, { useState, useRef, useEffect } from 'react';
import { Pipette, Copy, Check } from 'lucide-react';
import Dropzone from './Dropzone';
import { fileToDataUrl } from '../lib/utils';

export default function ColorPickerTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState({ hex: '#000000', rgb: 'rgb(0,0,0)' });
  const [selectedColor, setSelectedColor] = useState({ hex: '#3b82f6', rgb: 'rgb(59, 130, 246)' });
  const [copied, setCopied] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFiles = async (files: File[]) => {
    const dataUrl = await fileToDataUrl(files[0]);
    setSourceImage(dataUrl);
  };

  useEffect(() => {
    if (sourceImage && canvasRef.current) {
      const img = new Image();
      img.src = sourceImage;
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        
        // Fit canvas to display width
        const displayWidth = containerRef.current?.clientWidth || 800;
        const scale = displayWidth / img.width;
        canvas.width = displayWidth;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  }, [sourceImage]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    
    setHoverColor({ hex, rgb });
  };

  const handleClick = () => {
    setSelectedColor(hoverColor);
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {!sourceImage ? (
        <Dropzone onFiles={handleFiles} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
             <div 
               ref={containerRef}
               className="glass-card !p-0 rounded-3xl overflow-hidden cursor-crosshair relative border-2 border-transparent hover:border-blue-500 transition-all shadow-2xl"
             >
               <canvas 
                 ref={canvasRef} 
                 onMouseMove={handleMouseMove}
                 onClick={handleClick}
                 className="block w-full"
               />
               <div 
                 className="absolute pointer-events-none w-12 h-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-75"
                 style={{ 
                   left: '20px', bottom: '20px',
                   backgroundColor: hoverColor.hex 
                 }}
               />
             </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Color</h3>
              <div 
                className="w-full aspect-square rounded-3xl shadow-inner border border-white/20"
                style={{ backgroundColor: selectedColor.hex }}
              />
              
              <div className="space-y-3">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400">HEX</label>
                   <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                     <span className="font-mono font-bold">{selectedColor.hex}</span>
                     <button onClick={() => handleCopy(selectedColor.hex)} className="hover:text-blue-500 transition-colors">
                       <Copy size={16} />
                     </button>
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400">RGB</label>
                   <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                     <span className="font-mono text-xs font-bold">{selectedColor.rgb}</span>
                     <button onClick={() => handleCopy(selectedColor.rgb)} className="hover:text-blue-500 transition-colors">
                       <Copy size={16} />
                     </button>
                   </div>
                </div>
              </div>

              {copied && <p className="text-center text-xs font-bold text-green-500 animate-bounce">Copied to clipboard!</p>}
            </div>

            <div className="glass-card p-4 flex items-center justify-center gap-3 text-slate-400 text-sm italic">
               <Pipette size={18} />
               Click pixel to pick
            </div>
            
            <button
               onClick={() => setSourceImage(null)}
               className="w-full glass-card text-slate-500 font-bold"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
