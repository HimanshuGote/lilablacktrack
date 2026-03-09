import { useCallback, useRef, useState } from 'react';
import { Upload, FolderOpen, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadMultipleFiles } from '@/lib/parquetLoader';
import { useDataStore } from '@/store/useDataStore';

export function DataUploader() {
  const { setEvents, setLoading, loading, loadProgress, setLoadProgress } = useDataStore();
  const folderRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setLoading(true);
      setLoadProgress(0, files.length);
      try {
        const events = await loadMultipleFiles(files, (loaded, total) => {
          setLoadProgress(loaded, total);
        });
        setEvents(events);
      } catch (err) {
        console.error('Failed to load files:', err);
      } finally {
        setLoading(false);
      }
    },
    [setEvents, setLoading, setLoadProgress]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const items = e.dataTransfer.items;
      const files: File[] = [];

      // Try to read directories
      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }

      if (entries.length > 0) {
        const readEntry = (entry: FileSystemEntry): Promise<File[]> => {
          return new Promise((resolve) => {
            if (entry.isFile) {
              (entry as FileSystemFileEntry).file((f) => resolve([f]));
            } else {
              const reader = (entry as FileSystemDirectoryEntry).createReader();
              reader.readEntries(async (subEntries) => {
                const subFiles = await Promise.all(subEntries.map(readEntry));
                resolve(subFiles.flat());
              });
            }
          });
        };
        const allFiles = await Promise.all(entries.map(readEntry));
        files.push(...allFiles.flat());
      } else {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          files.push(e.dataTransfer.files[i]);
        }
      }

      if (files.length > 0) handleFiles(files);
    },
    [handleFiles]
  );

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[80vh] gap-6 p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-4">
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-2"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          LILA BLACK
        </h1>
        <p className="text-lg text-muted-foreground font-medium">
          Level Design Analytics
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative w-full max-w-xl border-2 border-dashed rounded-xl p-12
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
          }
        `}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-foreground font-semibold">
                Loading files... {loadProgress.loaded} / {loadProgress.total}
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${loadProgress.total > 0 ? (loadProgress.loaded / loadProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-foreground font-semibold text-lg">
                  Drop your player_data folder here
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Or use the buttons below to select files
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => folderRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg
                     font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <FolderOpen className="w-4 h-4" />
          Select Folder
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg
                     font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          Select Files
        </button>
      </div>

      <input
        ref={folderRef}
        type="file"
        className="hidden"
        {...({ webkitdirectory: '', directory: '', multiple: true } as any)}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <p className="text-xs text-muted-foreground max-w-md text-center">
        Load .nakama-0 parquet files from the player_data directory.
        Supports individual files or entire folders with subfolders (February_10, etc.)
      </p>
    </motion.div>
  );
}
