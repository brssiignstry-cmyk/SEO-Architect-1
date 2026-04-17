import React, { useRef, useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { extractLinksFromDocument } from '../services/geminiService';

interface Props {
  type: 'external' | 'internal';
  onExtract: (linksText: string) => void;
}

export function LinkUpload({ type, onExtract }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    try {
      const result = await extractLinksFromDocument(file, type);
      if (result) {
        onExtract(result);
      } else {
        setError('No links found in the document.');
      }
    } catch (e) {
      console.error(e);
      setError(`Extraction failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.pdf,.docx,.xlsx,.xls,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 py-1.5 px-3 rounded-lg transition-colors border border-slate-200 shadow-sm disabled:opacity-50"
        title="Upload PDF, DOCX, CSV, or Google Sheets/Excel (XLSX) to extract URLs and Anchor texts"
      >
        {isProcessing ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <Upload className="w-4 h-4 text-slate-500" />}
        {isProcessing ? 'Extracting via AI...' : 'Upload File'}
      </button>
      {error && <span className="text-[10px] text-red-500 max-w-[200px] text-right truncate" title={error}>{error}</span>}
    </div>
  );
}
