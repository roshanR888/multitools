import { useState, useEffect } from 'react';
import { Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { downloadBlob, dataUrlToBlob } from '../lib/utils';

export default function QRCodeTool() {
  const [text, setText] = useState('https://google.com');
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(256);
  const [margin, setMargin] = useState(4);

  const generateQR = async () => {
    try {
      const url = await QRCode.toDataURL(text, {
        width: size,
        margin: margin,
        color: {
          dark: color,
          light: bgColor,
        },
      });
      setQrImageUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (text) {
      generateQR();
    } else {
      setQrImageUrl(null);
    }
  }, [text, color, bgColor, size, margin]);

  const handleDownload = async () => {
    if (qrImageUrl) {
      const blob = await dataUrlToBlob(qrImageUrl);
      downloadBlob(blob, 'qrcode.png');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#4f46e5', '#8b5cf6']
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Side */}
        <div className="space-y-6">
          <div className="glass-card space-y-4">
            <div>
              <label htmlFor="qr-input" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                URL or Text
              </label>
              <textarea
                id="qr-input"
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none"
                placeholder="Enter URL or text to generate QR code..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  QR Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer bg-transparent border-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Background
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer bg-transparent border-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold">Size</label>
                  <span className="text-xs font-mono text-indigo-600 font-bold">{size}px</span>
                </div>
                <input
                  type="range"
                  min="128"
                  max="1024"
                  step="64"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold">Margin</label>
                  <span className="text-xs font-mono text-indigo-600 font-bold">{margin}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleDownload}
              disabled={!qrImageUrl}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
            >
              <Download size={20} />
              Download PNG
            </button>
            <button
              onClick={() => {
                setText('https://google.com');
                setColor('#000000');
                setBgColor('#ffffff');
                setSize(256);
                setMargin(4);
              }}
              className="glass-card px-6 font-bold text-slate-600 dark:text-slate-300"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Preview Side */}
        <div className="flex flex-col gap-4">
          <div className="glass-card flex-1 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
            <p className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Preview</p>
            
            {qrImageUrl ? (
              <div 
                className="p-4 rounded-2xl shadow-2xl bg-white dark:bg-slate-800 transition-all duration-300 hover:scale-105 active:scale-95 cursor-zoom-in"
                style={{ backgroundColor: bgColor }}
              >
                <img 
                  src={qrImageUrl} 
                  alt="QR Code Preview" 
                  className="w-full max-w-[300px] h-auto rounded-lg"
                  style={{ width: size > 300 ? 300 : size }}
                />
              </div>
            ) : (
              <div className="text-center space-y-3 p-12">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-300 dark:text-slate-700">
                  <QrCode size={40} />
                </div>
                <p className="text-sm font-medium text-slate-400">Enter some text to see the QR code</p>
              </div>
            )}
          </div>
          
          <div className="glass-card p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-500/10">
            <p className="text-xs font-medium text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed">
              <strong>Tip:</strong> QR codes can handle up to 4,296 alphanumeric characters, but smaller amounts of text make it easier for cameras to scan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
