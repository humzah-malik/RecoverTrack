// src/components/BulkImportModal.tsx
import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useBulkImport } from '../api/bulkImport'
import { useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const dropzoneRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // UI state
  const [fileName, setFileName] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<{processed?:number;duplicates?:number;errors?:number}>({})
  const [isFullyOpen, setIsFullyOpen] = useState(false)

  useEffect(() => {
    console.log('[Modal] isOpen changed:', isOpen);
    if (!isOpen) {
      setFileName(null)
      setProgress(0)
      setStats({})
      setIsFullyOpen(false)
    } else {
      // Set fully open after a short delay to prevent immediate interaction
      setTimeout(() => setIsFullyOpen(true), 300)
    }
  }, [isOpen])

  // hook
  const mutation = useBulkImport(pct => setProgress(pct))

  const handleFile = (file: File) => {
    console.log('[handleFile] called with:', file);
    setFileName(file.name)
    mutation.mutate(file, {
      onSuccess: res => {
        setStats(res)
        queryClient.invalidateQueries({ queryKey: ['daily-log'] });
        queryClient.invalidateQueries({ queryKey: ['recovery'] });
        queryClient.invalidateQueries({ queryKey: ['history'] });
      }
    })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleClose = (e?: any) => {
    console.log('[Modal] onClose called!', e);
    // Prevent immediate closing by adding a small delay
    setTimeout(() => {
      onClose();
    }, 100);
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog 
        onClose={() => {}}
                className="fixed inset-0 z-50 overflow-y-auto"
              >
        <div className="flex items-center justify-center min-h-screen px-4">
          {/* Background overlay */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
          </Transition.Child>



          {/* Dialog panel */}
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-200"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transition-transform duration-150"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <Dialog.Title className="text-lg font-semibold mb-4">
                Bulk Import Daily Logs
              </Dialog.Title>

              {/* Drop zone */}
              <div
                ref={dropzoneRef}
                tabIndex={0}
                onDragOver={e => {
                  console.log('[Dropzone] onDragOver');
                  e.preventDefault();
                }}
                onDrop={e => {
                  console.log('[Dropzone] onDrop');
                  onDrop(e);
                }}
                className={`border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer ${
                  mutation.status === "pending" ? 'opacity-50 pointer-events-none' : ''
                } ${!isFullyOpen ? 'pointer-events-none opacity-75' : ''}`}
                onClick={e => {
                  console.log('[Dropzone] onClick, isFullyOpen:', isFullyOpen);
                  e.stopPropagation();
                  if (isFullyOpen) {
                    document.getElementById('bulk-file-input')?.click();
                  }
                }}
              >
                <p className="text-gray-600">
                  { fileName
                      ? `Selected file: ${fileName}`
                      : isFullyOpen 
                        ? 'Drag & drop CSV/XLSX here, or click to choose'
                        : 'Loading...'
                  }
                </p>
                <input
                  id="bulk-file-input"
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onClick={e => {
                    console.log('[FileInput] onClick');
                    e.stopPropagation();
                  }}
                  onChange={e => {
                    console.log('[FileInput] onChange', e.target.files);
                    if (e.target.files?.[0] && isFullyOpen) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {/* Progress bar */}
              {mutation.isLoading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uploading…</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-black transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload error */}
              {mutation.isError && (
                <p className="mt-4 text-sm text-red-600">
                  {mutation.error?.message || 'Upload failed'}
                </p>
              )}

              {/* Results */}
              {stats.processed != null && (
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="py-1 px-2 bg-green-100 rounded">
                    {stats.processed} imported
                  </div>
                  <div className="py-1 px-2 bg-yellow-100 rounded">
                    {stats.duplicates} updated
                  </div>
                  <div className="py-1 px-2 bg-red-100 rounded">
                    {stats.errors} errors
                  </div>
                </div>
              )}

              {/* Close button */}
              <div className="mt-6 text-right">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                >
                  Close
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}