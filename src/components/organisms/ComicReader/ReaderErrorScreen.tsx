'use client';

import { ArrowLeft } from 'lucide-react';

interface ReaderErrorScreenProps {
  title: string;
  message: string;
  onBack: () => void;
}

/** Full-screen generic reader error state. */
export const ReaderErrorScreen = ({ title, message, onBack }: ReaderErrorScreenProps) => {
  return (
    <div className="flex h-screen items-center justify-center bg-black p-8 text-center text-white">
      <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="text-red-500 flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-neutral-400">{message}</p>
        </div>
        <div className="flex justify-center pt-2">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Library</span>
          </button>
        </div>
      </div>
    </div>
  );
};
