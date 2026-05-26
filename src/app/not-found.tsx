import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-[#12121e]/80 border border-neutral-800/50 p-8 rounded-[1.8rem] backdrop-blur-xl shadow-2xl">
        <div className="w-24 h-24 bg-blue-500/10 border border-blue-500/30 rounded-[1.25rem] flex items-center justify-center text-blue-500 mx-auto text-4xl font-black italic">
          404
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight italic">Page Not Found</h2>
          <p className="text-neutral-400 text-sm">
            We couldn&apos;t find the comic issue, library catalog, or page you were looking for.
          </p>
        </div>
        
        <Link
          href="/library"
          className="block w-full py-3 px-5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all text-sm shadow-lg shadow-blue-500/20"
        >
          Return to Library
        </Link>
      </div>
    </div>
  );
}
