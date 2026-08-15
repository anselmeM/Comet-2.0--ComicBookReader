'use client';

import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import { motion } from 'framer-motion';
import {
  Zap,
  Loader2,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Layers,
  Trash2,
  Rocket,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import type { ComicPage } from '@/types';

// NOTE: JSZip + the parsing stack (comic-worker-client, comic-validation, hash,
// guidedView) are loaded lazily inside the handlers below, and this whole
// component is loaded via next/dynamic (ssr: false) only when it scrolls near
// the viewport (see LazySandbox in page.tsx). None of it ships in the initial
// landing-page bundle or hydration.

async function createMockCbzFile(): Promise<File> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const pageCount = 3;
  for (let i = 1; i <= pageCount; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 800, 1200);

      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, 790, 1190);

      ctx.fillStyle = '#18181b';
      ctx.fillRect(20, 20, 760, 320);
      ctx.fillRect(20, 360, 370, 420);
      ctx.fillRect(410, 360, 370, 420);
      ctx.fillRect(20, 800, 760, 380);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`PAGE ${i}: COMET DECOMPRESSION`, 60, 100);
      ctx.fillStyle = '#71717a';
      ctx.font = '20px sans-serif';
      ctx.fillText('Testing client-side Web Worker parsing speed...', 60, 150);

      ctx.fillStyle = i === 1 ? '#ff5a00' : i === 2 ? '#a3e635' : '#eab308';
      ctx.fillRect(60, 400, 290, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('High Performance', 85, 560);

      ctx.fillStyle = '#e65100';
      ctx.fillRect(450, 400, 290, 300);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Guided View', 475, 560);

      ctx.fillStyle = '#141416';
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 840, 680, 280);
      ctx.fillRect(60, 840, 680, 280);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'italic 20px sans-serif';
      ctx.fillText(`"This mock comic page was compiled in-memory in less than 5ms."`, 100, 950);
      ctx.fillText(`"Decompression runs at ~120 pages/second on this device."`, 100, 1000);
    }
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
    });
    zip.file(`page_${i}.jpg`, blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return new File([zipBlob], 'comet-sample-sandbox.cbz', { type: 'application/x-cbz' });
}

export default function SandboxDemo() {
  // Sandbox state
  const [sandboxFile, setSandboxFile] = useState<File | null>(null);
  const [sandboxPages, setSandboxPages] = useState<ComicPage[]>([]);
  const [sandboxIsParsing, setSandboxIsParsing] = useState(false);
  const [sandboxProgress, setSandboxProgress] = useState<{
    page: number;
    total: number;
    phase: string;
  } | null>(null);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [sandboxMetrics, setSandboxMetrics] = useState<{
    hashingTime: number;
    decompressionTime: number;
    throughput: number;
    fileSize: number;
    format: string;
  } | null>(null);
  const [sandboxCurrentPage, setSandboxCurrentPage] = useState(0);
  const [sandboxShowPanels, setSandboxShowPanels] = useState(false);
  const [sandboxDetectedPanels, setSandboxDetectedPanels] = useState<Record<number, { x: number; y: number; width: number; height: number }[]>>({});
  const [sandboxIsDetecting, setSandboxIsDetecting] = useState(false);
  const [sandboxIsDragging, setSandboxIsDragging] = useState(false);

  // Guided View panel detection for sandbox previewer
  useEffect(() => {
    if (!sandboxShowPanels || sandboxPages.length === 0) return;
    const pageIdx = sandboxCurrentPage;
    if (sandboxDetectedPanels[pageIdx]) return;

    const runDetection = async () => {
      setSandboxIsDetecting(true);
      try {
        const { detectPanels } = await import('@/lib/guidedView');
        const page = sandboxPages[pageIdx];
        const imageBitmap = await createImageBitmap(page.blob);
        const panels = await detectPanels(imageBitmap);
        setSandboxDetectedPanels((prev) => ({ ...prev, [pageIdx]: panels }));
        imageBitmap.close();
      } catch (err) {
        logger.error('Panel detection failed', {}, err as Error);
      } finally {
        setSandboxIsDetecting(false);
      }
    };

    runDetection();
  }, [sandboxShowPanels, sandboxCurrentPage, sandboxPages, sandboxDetectedPanels]);

  const handleSandboxParse = async (file: File) => {
    setSandboxIsParsing(true);
    setSandboxError(null);
    setSandboxMetrics(null);
    setSandboxPages([]);
    setSandboxCurrentPage(0);
    setSandboxDetectedPanels({});
    setSandboxShowPanels(false);
    setSandboxFile(file);

    let hashingTime = 0;
    let decompressionTime = 0;

    try {
      const { validateComicArchive } = await import('@/lib/comic-validation');
      const { computeFileHash } = await import('@/lib/hash');
      const { executeParserWorker } = await import('@/lib/comic-worker-client');

      await validateComicArchive(file);

      setSandboxProgress({ phase: 'hashing', page: 0, total: 100 });
      const hashStartTime = performance.now();
      const hash = await computeFileHash(file, (progress) => {
        setSandboxProgress({ phase: 'hashing', page: Math.round(progress * 100), total: 100 });
      });
      hashingTime = performance.now() - hashStartTime;

      setSandboxProgress({ phase: 'parsing', page: 0, total: 100 });
      const decompStartTime = performance.now();
      const parsedPages = await executeParserWorker(file, hash, (page, total) => {
        setSandboxProgress({ phase: 'parsing', page, total });
      });
      decompressionTime = performance.now() - decompStartTime;

      const throughput = parsedPages.length / (decompressionTime / 1000);

      setSandboxPages(parsedPages);
      setSandboxMetrics({
        hashingTime: Math.round(hashingTime),
        decompressionTime: Math.round(decompressionTime),
        throughput: Math.round(throughput),
        fileSize: file.size,
        format: file.name.endsWith('.cbr') ? 'CBR (RAR)' : 'CBZ (ZIP)',
      });
      setSandboxIsParsing(false);
      setSandboxProgress(null);
    } catch (err) {
      logger.error('Sandbox parse failed', {}, err instanceof Error ? err : undefined);
      setSandboxError(getErrorMessage(err) || 'Failed to parse file.');
      setSandboxIsParsing(false);
      setSandboxProgress(null);
    }
  };

  const handleSandboxDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setSandboxIsDragging(true);
  };

  const handleSandboxDragLeave = () => {
    setSandboxIsDragging(false);
  };

  const handleSandboxDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setSandboxIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSandboxParse(file);
  };

  const handleSandboxFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSandboxParse(file);
  };

  const handleTrySample = async () => {
    setSandboxIsParsing(true);
    setSandboxProgress({ phase: 'generating', page: 0, total: 100 });
    try {
      const mockFile = await createMockCbzFile();
      await handleSandboxParse(mockFile);
    } catch (err) {
      setSandboxError('Failed to generate mock sample.');
      setSandboxIsParsing(false);
    }
  };

  return (
    <section className="mt-48 w-full max-w-7xl mx-auto text-left relative z-20">
      <div className="bg-neutral-950/40 backdrop-blur-xl border-3 border-neutral-850 rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col lg:flex-row gap-12 items-stretch">
        {/* Left Side: Drag & Drop Dropzone */}
        <div className="flex-1 flex flex-col justify-between space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 text-[#a3e635] font-display font-black uppercase tracking-widest text-xs mb-4">
              <Zap size={12} className="text-[#a3e635] animate-pulse" />
              TRY OFFLINE PARSING
            </div>
            <h2 className="text-3xl md:text-5xl font-heading font-black text-white leading-none tracking-tighter italic uppercase mb-4">
              TEST SPEED IN REAL-TIME.
            </h2>
            <p className="text-neutral-400 text-sm max-w-lg leading-relaxed font-medium">
              Delegating compression routes to Web Workers prevents main-thread lag. Drag a
              local `.cbz` or `.cbr` file here to verify decompression throughput on your
              device.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleSandboxDragOver}
            onDragLeave={handleSandboxDragLeave}
            onDrop={handleSandboxDrop}
            onClick={() => document.getElementById('sandbox-file-input')?.click()}
            className={`border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center min-h-[220px] ${
              sandboxIsDragging
                ? 'border-[#ff5a00] bg-[#ff5a00]/10 scale-[1.01] shadow-[4px_4px_0px_0px_rgba(255,90,0,0.15)]'
                : 'border-neutral-855 bg-[#09090b]/40 hover:border-[#ff5a00]/50 hover:bg-[#ff5a00]/5'
            }`}
          >
            <input
              id="sandbox-file-input"
              type="file"
              accept=".cbz,.cbr,.zip"
              onChange={handleSandboxFileInput}
              className="hidden"
            />

            {sandboxIsParsing ? (
              <div className="space-y-4 w-full px-4" aria-live="polite">
                <Loader2 className="w-10 h-10 text-[#ff5a00] animate-spin mx-auto" />
                <div className="space-y-1">
                  <p className="text-white font-heading font-black uppercase text-xs tracking-wider">
                    {sandboxProgress?.phase === 'hashing'
                      ? 'Generating Signature...'
                      : sandboxProgress?.phase === 'generating'
                        ? 'Compiling Sample...'
                        : 'Decompressing Archive...'}
                  </p>
                  <p className="text-neutral-500 font-mono text-[10px]">
                    {sandboxProgress
                      ? `${sandboxProgress.page} / ${sandboxProgress.total} Pages`
                      : ''}
                  </p>
                </div>
                {/* Progress bar */}
                {sandboxProgress && (
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className="h-full bg-[#ff5a00] rounded-full shadow-[0_0_10px_rgba(255,90,0,0.4)]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(sandboxProgress.page / sandboxProgress.total) * 100}%`,
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <UploadCloud
                  className={`w-10 h-10 mb-4 transition-colors ${sandboxIsDragging ? 'text-[#ff5a00]' : 'text-neutral-500 group-hover:text-[#ff5a00]'}`}
                />
                <p className="font-heading font-black text-white text-xs uppercase tracking-wider mb-1">
                  Drag & drop your archive
                </p>
                <p className="text-[10px] text-neutral-500 font-mono mb-4">
                  ZIP, RAR, CBZ, or CBR up to 1GB
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrySample();
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white border-2 border-neutral-950 font-heading font-black text-[10px] px-5 py-2.5 rounded-lg transition-all uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_0px_#000]"
                  >
                    Try with Sample
                  </button>
                </div>
              </>
            )}
          </div>

          {sandboxError && (
            <p className="text-xs font-mono text-red-400 bg-red-955/20 border border-red-500/20 px-4 py-3 rounded-xl">
              Error: {sandboxError}
            </p>
          )}
        </div>

        {/* Right Side: Metrics Dashboard and Viewer */}
        <div className="flex-1 bg-neutral-955 border-2 border-neutral-850 rounded-2xl p-6 flex flex-col justify-between min-h-[400px]">
          {sandboxPages.length > 0 && sandboxMetrics ? (
            <div className="h-full flex flex-col justify-between space-y-6">
              {/* Performance stats console */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#09090b] p-3 rounded-xl border border-neutral-850 text-center">
                  <span className="text-[9px] font-display font-black text-neutral-500 uppercase tracking-widest block">
                    Throughput
                  </span>
                  <span className="text-xl font-heading font-black text-[#a3e635] italic block mt-1">
                    {sandboxMetrics.throughput} p/s
                  </span>
                </div>
                <div className="bg-[#09090b] p-3 rounded-xl border border-neutral-855 text-center">
                  <span className="text-[9px] font-display font-black text-neutral-500 uppercase tracking-widest block">
                    Decompress Time
                  </span>
                  <span className="text-xl font-heading font-black text-white block mt-1 font-mono">
                    {sandboxMetrics.decompressionTime}ms
                  </span>
                </div>
                <div className="bg-[#09090b] p-3 rounded-xl border border-neutral-855 text-center col-span-2 sm:col-span-1">
                  <span className="text-[9px] font-display font-black text-neutral-500 uppercase tracking-widest block">
                    Deduplication Hash
                  </span>
                  <span className="text-sm font-heading font-black text-white block mt-1 font-mono">
                    {sandboxMetrics.hashingTime}ms
                  </span>
                </div>
                <div className="bg-[#09090b] p-3 rounded-xl border border-neutral-855 text-center col-span-2 sm:col-span-1">
                  <span className="text-[9px] font-display font-black text-neutral-500 uppercase tracking-widest block">
                    File Size
                  </span>
                  <span className="text-sm font-heading font-black text-white block mt-1 font-mono">
                    {(sandboxMetrics.fileSize / (1024 * 1024)).toFixed(1)}MB
                  </span>
                </div>
              </div>

              {/* Comic Sandbox Viewer */}
              <div className="flex-1 relative bg-[#09090b] border-2 border-neutral-855 rounded-xl overflow-hidden aspect-[4/3] max-h-[300px] flex items-center justify-center shadow-inner group/viewer">
                {/* The Page Image */}
                <img
                  src={URL.createObjectURL(sandboxPages[sandboxCurrentPage].blob)}
                  alt="Sandbox Preview Page"
                  className="max-h-full max-w-full object-contain pointer-events-none select-none"
                />

                {/* Guided View Panel Overlays */}
                {sandboxShowPanels && sandboxDetectedPanels[sandboxCurrentPage] && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center">
                    <div className="relative aspect-auto max-h-full max-w-full w-full h-full">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-h-full max-w-full flex items-center justify-center">
                        <div
                          className="relative w-full h-full"
                          style={{
                            aspectRatio: `${sandboxPages[sandboxCurrentPage].width}/${sandboxPages[sandboxCurrentPage].height}`,
                          }}
                        >
                          {sandboxDetectedPanels[sandboxCurrentPage].map((panel, idx) => {
                            const pageW = sandboxPages[sandboxCurrentPage].width;
                            const pageH = sandboxPages[sandboxCurrentPage].height;
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="absolute border-2 border-[#ef4444] bg-[#ef4444]/10 rounded shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                                style={{
                                  left: `${(panel.x / pageW) * 100}%`,
                                  top: `${(panel.y / pageH) * 100}%`,
                                  width: `${(panel.width / pageW) * 100}%`,
                                  height: `${(panel.height / pageH) * 100}%`,
                                }}
                              >
                                <span className="absolute -top-4 left-0 bg-[#ef4444] text-white text-[8px] font-heading font-black px-1.5 py-0.5 rounded-t shadow-md">
                                  {idx + 1}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {sandboxIsDetecting && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-[#ff5a00] animate-spin" />
                    <span className="text-white text-xs font-heading font-black uppercase tracking-wider">
                      Analyzing margins...
                    </span>
                  </div>
                )}

                {/* Navigation Overlays */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover/viewer:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setSandboxCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={sandboxCurrentPage === 0}
                    className="p-3 bg-neutral-950/95 hover:bg-[#18181b] border-2 border-neutral-855 text-white rounded-xl transition-all pointer-events-auto disabled:opacity-30 disabled:pointer-events-none active:scale-90"
                  >
                    <ChevronLeft size={16} />
                    <span className="sr-only">Previous Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSandboxCurrentPage((p) => Math.min(sandboxPages.length - 1, p + 1))
                    }
                    disabled={sandboxCurrentPage === sandboxPages.length - 1}
                    className="p-3 bg-neutral-950/95 hover:bg-[#18181b] border-2 border-neutral-855 text-white rounded-xl transition-all pointer-events-auto disabled:opacity-30 disabled:pointer-events-none active:scale-90"
                  >
                    <ChevronRight size={16} />
                    <span className="sr-only">Next Page</span>
                  </button>
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-neutral-950/90 px-4 py-1.5 rounded-full border border-neutral-855 text-[10px] font-mono font-bold text-neutral-400">
                  Page {sandboxCurrentPage + 1} / {sandboxPages.length}
                </div>
              </div>

              {/* Panel Overlay Toggle Controls */}
              <div className="flex items-center justify-between border-t border-neutral-900 pt-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSandboxShowPanels(!sandboxShowPanels)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-heading font-black uppercase tracking-widest transition-all ${
                      sandboxShowPanels
                        ? 'bg-[#ff5a00] text-white border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]'
                        : 'bg-neutral-900 text-neutral-400 border-2 border-neutral-855 hover:text-white'
                    }`}
                  >
                    <Layers size={12} />
                    <span>Detect Panels</span>
                  </button>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider hidden sm:inline">
                    Client-side segmentation
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSandboxPages([]);
                    setSandboxMetrics(null);
                    setSandboxFile(null);
                  }}
                  className="p-2.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Clear Sandbox"
                >
                  <Trash2 size={16} />
                  <span className="sr-only">Clear Sandbox</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="bg-neutral-900 border-2 border-neutral-855 p-4 rounded-2xl mb-6 text-neutral-500 select-none">
                <Rocket size={24} className="mx-auto" />
              </div>
              <h4 className="text-white font-heading font-black text-sm uppercase tracking-wider mb-2">
                Metrics Console Idle
              </h4>
              <p className="text-xs text-neutral-400 max-w-xs leading-relaxed font-medium">
                Upload a local volume or run the mock generator to view hashing, parsing, and
                rendering throughput statistics.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
