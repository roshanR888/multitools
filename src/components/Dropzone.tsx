import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '../lib/utils';

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export default function Dropzone({ onFiles, accept = "image/*", multiple = false }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      onFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="group relative border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center hover:border-blue-500 transition-all cursor-pointer bg-white/50 dark:bg-slate-900/50"
    >
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => e.target.files && onFiles(Array.from(e.target.files))}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
          <Upload size={32} />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            Drag & drop images here
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            or click to browse from your device
          </p>
        </div>
      </div>
    </div>
  );
}
