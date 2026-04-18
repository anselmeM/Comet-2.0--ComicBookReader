'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Panel } from '@/types';
import { X, Save, Trash2, Plus, MousePointer2 } from 'lucide-react';
import Image from 'next/image';

interface PanelEditorProps {
  image: string;
  initialPanels: Panel[];
  onSave: (panels: Panel[]) => void;
  onCancel: () => void;
}

export function PanelEditor({ image, initialPanels, onSave, onCancel }: PanelEditorProps) {
  const [panels, setPanels] = useState<Panel[]>(initialPanels);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      setImgDims({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [image]);

  const handleDelete = () => {
    if (selectedIdx !== null) {
      setPanels(panels.filter((_, i) => i !== selectedIdx));
      setSelectedIdx(null);
    }
  };

  const handleAdd = () => {
    // Add a default panel in the center
    const newPanel: Panel = {
      x: imgDims.width * 0.25,
      y: imgDims.height * 0.25,
      width: imgDims.width * 0.5,
      height: imgDims.height * 0.5
    };
    setPanels([...panels, newPanel]);
    setSelectedIdx(panels.length);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex flex-col">
      {/* Toolbar */}
      <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-zinc-900/50">
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="p-3 hover:bg-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all">
            <X size={24} />
          </button>
          <h2 className="text-xl font-black text-white italic tracking-tighter">Panel Editor</h2>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-sm transition-all"
          >
            <Plus size={18} /> Add Panel
          </button>
          <button 
            onClick={handleDelete}
            disabled={selectedIdx === null}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-sm transition-all disabled:opacity-30"
          >
            <Trash2 size={18} /> Delete
          </button>
          <div className="w-px h-8 bg-white/10 mx-2" />
          <button 
            onClick={() => onSave(panels)}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto p-12 flex justify-center bg-[#050505] relative">
        <div 
          ref={containerRef}
          className="relative shadow-2xl"
          style={{ 
            width: 'fit-content',
            height: 'fit-content'
          }}
        >
          <div 
            className="relative"
            style={{ 
              width: imgDims.width ? 'min(90vw, 800px)' : 0,
              aspectRatio: `${imgDims.width} / ${imgDims.height}`
            }}
          >
            {image && imgDims.width > 0 && (
              <Image 
                src={image} 
                alt="Edit panels"
                fill
                priority
                className="object-contain select-none pointer-events-none" 
              />
            )}
          </div>
          
          {/* Panel Overlays */}
          {panels.map((panel, idx) => {
            // Simplified overlay for MVP - in a real app we'd add resizing handles
            const scaleX = 100 / imgDims.width;
            const scaleY = 100 / imgDims.height;

            return (
              <div
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`absolute border-2 transition-all cursor-pointer ${
                  selectedIdx === idx ? 'border-blue-500 bg-blue-500/20 z-20' : 'border-white/40 bg-white/5 hover:border-white/60 z-10'
                }`}
                style={{
                  left: `${panel.x * scaleX}%`,
                  top: `${panel.y * scaleY}%`,
                  width: `${panel.width * scaleX}%`,
                  height: `${panel.height * scaleY}%`
                }}
              >
                <div className="absolute -top-3 -left-3 w-6 h-6 bg-zinc-900 border border-white/20 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                  {idx + 1}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Instructions Overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-4">
          <div className="flex items-center gap-2"><MousePointer2 size={14} /> Click panel to select</div>
          <div className="w-px h-4 bg-white/10" />
          <div>Drag borders to resize (TBD)</div>
        </div>
      </div>
    </div>
  );
}
