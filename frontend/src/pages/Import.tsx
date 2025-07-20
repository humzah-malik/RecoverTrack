// src/pages/ImportPage.tsx
import FileDrop from '../components/FileDrop'
import { Toaster } from 'react-hot-toast'

export default function ImportPage() {
  return (
    <>
      <Toaster position="top-center" />

      <main className="flex-grow flex justify-center items-start pt-16 pb-20 px-4 sm:px-6 lg:px-8">
      <section
          className="card-base max-w-3xl w-full p-8
                     bg-white dark:bg-[var(--surface)]"
          aria-label="Bulk import section"
        >
          {/* Directly show your FileDrop component */}
          <FileDrop
            onDone={() => {
              /* e.g. reset page state or show a success banner */
            }}
          />
        </section>
      </main>
    </>
  )
}