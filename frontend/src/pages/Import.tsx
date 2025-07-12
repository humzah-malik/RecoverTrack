import FileDrop from '../components/FileDrop';
import { Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function ImportPage() {
  return (
    <>
      <Toaster position="top-center" />
      {/* page header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex justify-between items-center">
          <Link to="/dashboard" className="font-semibold">FitRecover</Link>
          <span className="font-normal">Bulk Import</span>
        </div>
      </header>

      {/* main */}
      <main className="flex-grow flex justify-center items-start pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <section
          className="bg-white rounded-lg border border-gray-200 max-w-3xl w-full p-8"
          aria-label="Bulk import section"
        >
          {/* success banner appears via toast; the component handles stats */}
          <FileDrop onDone={() => {/* optional navigate elsewhere */}} />
        </section>
      </main>
    </>
  );
}