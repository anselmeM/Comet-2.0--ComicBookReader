'use client';

import React, { useState, useRef } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

/** Backup & Portability section — export/import the portable JSON bundle. */
export const ImportExportSection = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/user/backup');
      if (!res.ok) throw new Error('Failed to fetch backup from server');

      const serverData = await res.json();

      const readerStorage =
        typeof window !== 'undefined' ? localStorage.getItem('comet-reader-storage') : null;
      const settingsStorage =
        typeof window !== 'undefined' ? localStorage.getItem('comet-settings-storage') : null;

      const fullBackup = {
        ...serverData,
        clientSettings: {
          reader: readerStorage ? JSON.parse(readerStorage)?.state : null,
          settings: settingsStorage ? JSON.parse(settingsStorage)?.state : null,
        },
      };

      const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comet-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.error('Export backup error:', {}, e instanceof Error ? e : undefined);
      alert(e instanceof Error ? e.message : 'Error exporting backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        'Are you sure you want to import this backup? This will overwrite your settings, streaks, and reading history.',
      )
    ) {
      if (backupInputRef.current) backupInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.clientSettings) {
        if (data.clientSettings.settings) {
          localStorage.setItem(
            'comet-settings-storage',
            JSON.stringify({ state: data.clientSettings.settings, version: 0 }),
          );
        }
        if (data.clientSettings.reader) {
          localStorage.setItem(
            'comet-reader-storage',
            JSON.stringify({ state: data.clientSettings.reader, version: 0 }),
          );
        }
      }

      const response = await fetch('/api/user/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Failed to upload backup to server');
      }

      const result = await response.json();
      alert(
        `Backup imported successfully! Restored settings and updated progress for ${result.comicsRestoredCount} comics.`,
      );
      window.location.reload();
    } catch (err) {
      logger.error('Import backup error:', {}, err instanceof Error ? err : undefined);
      alert(err instanceof Error ? err.message : 'Failed to import backup file');
    } finally {
      setIsImporting(false);
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
        <Download className="text-comet-muted" />
        Backup & Portability
      </h2>

      <div className="bg-comet-surface border border-comet-border rounded-2xl p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-comet-text mb-2">Import / Export Local Data</h3>
          <p className="text-comet-muted text-sm max-w-xl leading-relaxed">
            Backup your entire reading history, streaks, bookmarks, custom metadata, and reader
            configurations. Save the portable JSON file on your computer to restore your state
            anytime or migrate to a new device.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-comet-surface-2 hover:bg-comet-surface border border-comet-border text-comet-text rounded-xl active:scale-95 transition-all font-medium disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>Export Portable JSON</span>
          </button>

          <button
            onClick={() => backupInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-comet-accent hover:bg-comet-accent-hover text-white rounded-xl active:scale-95 transition-all font-medium disabled:opacity-50 cursor-pointer"
          >
            {isImporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>Import Portable JSON</span>
          </button>

          <input
            type="file"
            ref={backupInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>
    </section>
  );
};
