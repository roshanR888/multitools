import { useState, useRef, useEffect } from 'react';
import { Download, Crop, RefreshCw } from 'lucide-react';
import Cropper from 'cropperjs';
import Dropzone from './Dropzone';
import { fileToDataUrl, downloadBlob, cn } from '../lib/utils';
import confetti from 'canvas-confetti';

const PRESETS = [
  { id: '1:1', label: '1:1 (Square)', ratio: 1/1 },
  { id: '16:9', label: '16:9 (Landscape)', ratio: 16/9 },
  { id: '9:16', label: '9:16 (Stories)', ratio: 9/16 },
  { id: '4:5', label: '4:5 (Post)', ratio: 4/5 },
  { id: 'free', label: 'Free', ratio: NaN },
];

export default function CropperTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [cropper, setCropper] = useState<Cropper | null>(null);
  const [activeRatio, setActiveRatio] = useState<number>(1/1);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setSourceImage(dataUrl);
  };

  useEffect(() => {
    if (sourceImage && imageRef.current) {
      if (cropper) {
        cropper.destroy();
      }
      const newCropper = new Cropper(imageRef.current, {
        aspectRatio: activeRatio,
        viewMode: 1,
        autoCropArea: 0.8,
        background: false,
        preview: '#cropper-preview',
      });
      setCropper(newCropper);
    }
  }, [sourceImage]);

  const changeRatio = (ratio: number) => {
    setActiveRatio(ratio);
    if (cropper) {
      cropper.setAspectRatio(ratio);
    }
  };

  const handleSave = () => {
    if (cropper) {
      const canvas = cropper.getCroppedCanvas();
      canvas.toBlob((blob) => {
        downloadBlob(blob!, 'cropped-image.jpg');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 'image/jpeg', 0.9);
    }
  };

  return (
    <div className="space-y-6">
      {!sourceImage ? (
        <Dropzone onFiles={handleFiles} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-3 glass-card !p-4 bg-slate-900 rounded-3xl overflow-hidden min-h-[400px]">
              {sourceImage && <img ref={imageRef} src={sourceImage} className="max-w-full block" />}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Preview</h3>
              <div className="aspect-square glass-card bg-slate-800 rounded-2xl overflow-hidden relative border-none">
                <div id="cropper-preview" className="absolute inset-0 overflow-hidden" />
              </div>
              <p className="text-[10px] text-slate-500 text-center">Preview of the current crop selection</p>
            </div>
          </div>

          <div className="glass-card space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aspect Ratio</h3>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => changeRatio(preset.ratio)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-bold transition-all",
                    (isNaN(preset.ratio) && isNaN(activeRatio)) || preset.ratio === activeRatio
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-blue-500"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Crop size={20} />
              Save Crop
            </button>
            <button
              onClick={() => {
                setSourceImage(null);
                cropper?.destroy();
                setCropper(null);
              }}
              className="glass-card !py-4 px-8 font-bold text-slate-600 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
