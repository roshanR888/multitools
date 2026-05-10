/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Download, 
  Upload, 
  Check, 
  Copy,
  Plus,
  RefreshCw,
  Droplets
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TOOLS, ToolId } from './constants';
import { cn, fileToDataUrl, downloadBlob, formatBytes, dataUrlToBlob } from './lib/utils';

// Tool Components (to be implemented)
import CompressorTool from './components/CompressorTool';
import ResizerTool from './components/ResizerTool';
import OCRTool from './components/OCRTool';
import WebPTool from './components/WebPTool';
import CropperTool from './components/CropperTool';
import WatermarkTool from './components/WatermarkTool';
import ColorPickerTool from './components/ColorPickerTool';
import QRCodeTool from './components/QRCodeTool';
import ImageToUrlTool from './components/ImageToUrlTool';
import PDFEditorTool from './components/PDFEditorTool';
import AdSpace from './components/AdSpace';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('compressor');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderTool = () => {
    switch (activeTool) {
      case 'compressor': return <CompressorTool />;
      case 'resizer': return <ResizerTool />;
      case 'ocr': return <OCRTool />;
      case 'webp-converter': return <WebPTool />;
      case 'cropper': return <CropperTool />;
      case 'watermark': return <WatermarkTool />;
      case 'color-picker': return <ColorPickerTool />;
      case 'qr-generator': return <QRCodeTool />;
      case 'image-to-url': return <ImageToUrlTool />;
      case 'pdf-editor': return <PDFEditorTool />;
      default: return null;
    }
  };

  const currentTool = TOOLS.find(t => t.id === activeTool)!;

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      {/* Header / Sidebar */}
      <nav id="main-nav" className="fixed top-0 left-0 right-0 h-16 glass z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            id="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div id="brand-container" className="flex items-center gap-3 active:scale-95 transition-all cursor-pointer group">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 group-hover:rotate-6 transition-transform duration-300" />
              <div className="absolute inset-0 border-2 border-indigo-200 dark:border-indigo-400/20 rounded-2xl group-hover:-rotate-6 transition-transform duration-300" />
              <div className="relative z-10 flex flex-col items-center leading-none">
                <span className="text-white text-[10px] font-black tracking-tighter">IMG</span>
                <div className="w-4 h-0.5 bg-indigo-300/60 rounded-full mt-0.5" />
              </div>
            </div>
            <h1 id="app-title" className="font-display tracking-tighter hidden sm:flex items-baseline">
              <span className="text-slate-900 dark:text-white font-black text-2xl">image</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xl ml-1">mb2kb</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:block text-slate-400 font-medium text-sm">
            {/* AD_UNIT_HERE */}
          </div>
          <button 
            id="theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 glass-card !p-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-none"
          >
            {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-600" />}
          </button>
        </div>
      </nav>

      {/* Main Content Layout */}
      <div id="app-layout" className="flex pt-16 h-[calc(100vh)] overflow-hidden">
        {/* Sidebar */}
        <aside id="sidebar" className={cn(
          "fixed inset-y-0 left-0 pt-16 w-72 glass border-r z-40 transition-all duration-300 ease-in-out transform",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 h-full overflow-y-auto space-y-1">
            <p className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-widest">Utilities</p>
            {TOOLS.map((tool) => (
              <button
                id={`tool-btn-${tool.id}`}
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  activeTool === tool.id 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                    : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg",
                  activeTool === tool.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700"
                )}>
                  <tool.icon size={18} />
                </div>
                <span className="font-semibold text-sm">{tool.name}</span>
              </button>
            ))}
            
            <div id="sidebar-ad-space" className="pt-8 px-3">
              <AdSpace type="sidebar" className="h-[250px]" />
            </div>
          </div>
        </aside>

        {/* Sidebar Overlay (Mobile Only) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Dynamic Tool Area */}
        <main 
          id="main-content" 
          className={cn(
            "flex-1 overflow-y-auto bg-stone-50 dark:bg-[#0c0a09] transition-all duration-300 ease-in-out",
            isSidebarOpen ? "md:ml-72" : "md:ml-0"
          )}
        >
          <div className="flex flex-col xl:flex-row w-full min-h-full">
            {/* Tool Content Column */}
            <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-20">
              {/* Header */}
              <header id="tool-header" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20">
                    <currentTool.icon size={24} />
                  </div>
                  <div>
                    <h2 id="tool-name" className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">
                      {currentTool.name}
                    </h2>
                    <p id="tool-description" className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      {currentTool.description}
                    </p>
                  </div>
                </div>

                {/* Inline Banner Ad */}
                <AdSpace type="banner" className="h-[60px] md:h-[90px]" />
              </header>

              {/* Tool Implementation */}
              <div id="tool-container" className="relative min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    id={`tool-wrapper-${activeTool}`}
                    key={activeTool}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderTool()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* SEO Section with Content Ad */}
              <section id="tool-info-section" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="md:col-span-2 glass-card space-y-4">
                  <h3 className="text-lg font-display font-bold">How to Use {currentTool.name}</h3>
                  <div id="tool-instructions" className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line prose dark:prose-invert">
                    {currentTool.seoDescription}
                    <br /><br />
                    <strong>Instructions:</strong>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Upload your image using the drag-and-drop area or file selector.</li>
                      <li>Adjust the tool settings to your requirements.</li>
                      <li>Preview the changes in real-time.</li>
                      <li>Click 'Download' to save your optimized media file.</li>
                    </ul>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <AdSpace type="content" className="w-full" label="Sponsored Content" />
                  <div className="glass-card p-4 space-y-2">
                    <h4 className="text-xs font-black uppercase text-slate-400">Quick Tip</h4>
                    <p className="text-xs text-slate-500">Processing large files might take a few seconds longer. Stay tuned!</p>
                  </div>
                </div>
              </section>
              
              <div id="bottom-ad-space" className="flex justify-center pt-8">
                <AdSpace type="footer" className="h-[90px] md:h-[120px]" />
              </div>
            </div>

            {/* Right Desktop Ads Sidebar */}
            <aside className="hidden xl:block w-[340px] border-l border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 p-6 space-y-6">
              <div className="sticky top-6 space-y-6">
                <AdSpace type="sidebar" label="Featured Partners" />
                <AdSpace type="content" className="h-[250px]" label="Advertisement" />
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Recommended Tools</h4>
                  <div className="space-y-2">
                    {TOOLS.slice(0, 3).map(tool => (
                      <button key={tool.id} onClick={() => setActiveTool(tool.id)} className="w-full text-left text-xs font-medium text-indigo-600 hover:underline truncate italic">
                        Try {tool.name} →
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

