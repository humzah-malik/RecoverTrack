import axios from './client';                 // existing configured instance
import { useMutation } from '@tanstack/react-query';

export interface BulkImportResult {
  processed: number;
  duplicates: number;
  errors: number;
  message: string;
}

export function useBulkImport() {
  return useMutation<BulkImportResult, Error, File>((file, { onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('file', file);

    return axios.post('/daily-log/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Track upload progress so we can show the bar
      onUploadProgress: evt => {
        const pct = Math.round((evt.loaded / (evt.total ?? 1)) * 100);
        // Emit progress percentage via callback if caller passed one
        (onSuccess as any)?.({ progress: pct });
      },
    }).then(res => ({
      processed:   res.data.processed ?? 0,
      duplicates:  res.data.duplicates ?? 0,
      errors:      res.data.errors ?? 0,
      message:     res.data.message  ?? 'Import complete',
    }));
  });
}