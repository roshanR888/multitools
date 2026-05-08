import React, { useState } from 'react';
import { Download, Check, RefreshCw, X, Instagram, Youtube, Music2 } from 'lucide-react';
import Dropzone from './Dropzone';
import { fileToDataUrl, downloadBlob, formatBytes, cn } from '../lib/utils';
import confetti from 'canvas-confetti';

const PRESETS = [
  { id: 'insta-post', name: 'Instagram', ratio: 1/1, label: 'Post (1:1)', icon: Instagram },
  { id: 'insta-story', name: 'Story/Reels', ratio: 9/16, label: '9:16', icon: Instagram },
  { id: 'youtube', name: 'YouTube', ratio: 16/9, label: '16:9', icon: Youtube },
  { id: 'tiktok', name: 'TikTok', ratio: 9/16, label: '9:16', icon: Music2 },
  { id: 'x-post', name: 'X (Twitter)', ratio: 16/9, label: 'Post (16:9)', icon: X },
];

export default function ResizerTool() {
  const [images, setImages] = useState<{file: File, preview: string, id: string}[]>([]);
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (newFiles: File[]) => {
    const newImages = await Promise.all(newFiles.map(async (file) => ({
      file,
      preview: await fileToDataUrl(file),
      id: Math.random().toString(36).substring(2, 9)
    })));
    setImages(prev => [...prev, ...newImages]);
  };

  const resizeImage = (dataUrl: string, ratio: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        const baseSize = 1080;
        if (ratio >= 1) {
          canvas.width = baseSize;
          canvas.height = baseSize / ratio;
        } else {
          canvas.height = baseSize;
          canvas.width = baseSize * ratio;
        }

        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const imgRatio = img.width / img.height;
        const targetRatio = canvas.width / canvas.height;
        
        let drawW, drawH, offsetW, offsetH;
        
        if (imgRatio > targetRatio) {
          drawW = canvas.width;
          drawH = canvas.width / imgRatio;
          offsetW = 0;
          offsetH = (canvas.height - drawH) / 2;
        } else {
          drawH = canvas.height;
          drawW = canvas.height * imgRatio;
          offsetH = 0;
          offsetW = (canvas.width - drawW) / 2;
        }

        ctx.drawImage(img, offsetW, offsetH, drawW, drawH);
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
      };
    });
  };

  const downloadAll = async () => {
    setIsProcessing(true);
    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      const resizedBlob = await resizeImage(item.preview, selectedPreset.ratio);
      downloadBlob(resizedBlob, `resized-${selectedPreset.id}-${item.file.name}`);
      if (i < images.length - 1) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
    setIsProcessing(false);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const removeImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImages(images.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-6">
      <Dropzone onFiles={handleFiles} multiple={true} />

      {images.length > 0 && (
        <div className="space-y-8">
          <div className="glass-card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Social Media Presets</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all group flex flex-col items-center gap-2",
                    selectedPreset.id === preset.id 
                      ? "border-blue-600 bg-blue-600/5 text-blue-600 scale-[1.02]" 
                      : "border-slate-100 dark:border-slate-800 hover:border-slate-300 text-slate-500"
                  )}
                >
                  <preset.icon size={20} className={cn(
                    "transition-transform",
                    selectedPreset.id === preset.id ? "scale-110" : "group-hover:scale-110"
                  )} />
                  <div className="text-center">
                    <p className="font-bold text-xs">{preset.name}</p>
                    <p className="text-[10px] opacity-60 font-medium">{preset.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-slate-900 dark:text-white">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Preview ({selectedPreset.label})</h3>
              <p className="text-[10px] text-slate-400">Mocking output crop fit</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((img) => (
                <div key={img.id} className="space-y-2 group">
                  <div 
                    className="relative rounded-2xl overflow-hidden glass shadow-xl border-none flex items-center justify-center bg-slate-900 mx-auto transition-all duration-300 overflow-hidden"
                    style={{ 
                      aspectRatio: `${selectedPreset.ratio}`,
                      maxHeight: '300px',
                      width: selectedPreset.ratio > 1 ? '100%' : 'auto'
                    }}
                  >
                    {img.preview && (
                      <img 
                        src={img.preview} 
                        className="max-w-full max-h-full object-contain"
                        alt="Preview"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                      <p className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2 py-1 rounded">Preview</p>
                    </div>
                    <button
                      onClick={(e) => removeImage(img.id, e)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-lg shadow-lg transition-colors"
                    >
                      <Check size={14} className="rotate-45" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate px-1 text-center font-medium">{img.file.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={downloadAll}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={24} /> : <Download size={24} />}
              <div className="text-left">
                <p className="text-sm">Download All Resized ({images.length})</p>
                <p className="text-[10px] font-medium opacity-70">Optimized for {selectedPreset.name}</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
