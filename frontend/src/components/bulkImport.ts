// src/api/bulkImport.ts
import axios from '../api/client'
import { useMutation } from '@tanstack/react-query'

export interface BulkImportResult {
  processed: number
  duplicates: number
  errors: number
  message: string
}

export function useBulkImport(onProgress: (pct: number) => void) {
  return useMutation<BulkImportResult, Error, File>({
    // ✏️ This is the key: wrap your upload logic in `mutationFn`
    mutationFn: file => {
      const formData = new FormData()
      formData.append('file', file)

      return axios.post('/daily-log/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: evt => {
          const pct = Math.round((evt.loaded / (evt.total ?? 1)) * 100)
          onProgress(pct)
        },
      }).then(res => ({
        processed:  res.data.processed  ?? 0,
        duplicates: res.data.duplicates ?? 0,
        errors:     res.data.errors     ?? 0,
        message:    res.data.message    ?? 'Import complete',
      }))
    }
  })
}