import { useRef, useState, DragEvent } from 'react';
import { useBulkImport } from './bulkImport';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface Props {
  onDone?: () => void;     // callback after successful import
}

export default function FileDrop({ onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const bulkImport = useBulkImport(pct => setProgress(pct))
  const [stats, setStats] = useState<{processed?:number; duplicates?:number; errors?:number}>({});
  const [fileName, setFileName] = useState<string|null>(null);
  const queryClient = useQueryClient();

  const handleFiles = (files: FileList | null) => {
    if (!files?.[0]) return;
    
    const file = files[0];
    setFileName(file.name);
    bulkImport.mutate(file, {
      onSuccess: res => {
        setStats(res)
        toast.success(res.message)
        queryClient.invalidateQueries({ queryKey: ['daily-log'] });
        queryClient.invalidateQueries({ queryKey: ['recovery'] });
        queryClient.invalidateQueries({ queryKey: ['history'] });
        onDone?.()
      },
      onError: err => toast.error(err.message),
    })
  }

  /* drag handlers */
  const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const drop    = (e: DragEvent) => { prevent(e); handleFiles(e.dataTransfer.files); };

  return (
    <div
      onDragEnter={prevent}
      onDragOver={prevent}
      onDrop={drop}
      className="
        card-base file-drop-zone max-w-xl mx-auto py-16
        flex flex-col items-center justify-center gap-3
        border-2 border-dashed border-border
      "
    >
      {fileName && (
        <p className="text-gray-700 text-sm mb-2">
          Selected: <strong>{fileName}</strong>
        </p>
      )}
      <i className="fas fa-cloud-upload-alt text-gray-500 text-3xl" />
      <p className="text-black text-base">Drag and drop your file here</p>
      <p className="text-gray-400 text-sm">or</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="btn-dark px-5 py-2 text-sm"
      >
        Choose File
      </button>
      <input
        type="file"
        accept=".csv,.xlsx"
        ref={inputRef}
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
      />
      <p className="text-gray-500 text-xs mt-2">CSV, XLSX (max&nbsp;10&nbsp;MB)</p>

      {/* progress & stats */}
      {bulkImport.status === "pending" && (
        <div className="w-full px-8 mt-6">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span>Uploading file…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-1 bg-[var(--accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {stats.processed !== undefined && (
        <div className="flex gap-4 mt-4">
          {['processed','duplicates','errors'].map(k => (
            <span key={k}
              className="bg-gray-100 rounded-full px-4 py-1 text-xs text-black">
              {stats[k as keyof typeof stats]} {k}
            </span>
          ))}
        </div>
      )}

      {/* template link */}
      <div className="flex justify-center mt-6 space-x-6">
        <a href="/templates/daily_log_template.xlsx"
            className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700">
            <i className="fas fa-download" /> XLSX Template
        </a>
        <a href="/templates/daily_log_template.csv"
            className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700">
            <i className="fas fa-download" /> CSV Template
        </a>
        </div>
    </div>
  );
}