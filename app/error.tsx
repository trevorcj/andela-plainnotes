'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-white text-[#09090b] flex flex-col items-center justify-center px-6 py-24 sm:py-32">
      <div className="w-full max-w-[420px] flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-[#71717a] mb-6">
          <AlertCircle size={22} strokeWidth={1.75} />
        </div>

        <h1 className="text-[22px] font-semibold text-[#09090b] mb-6 tracking-[-0.01em]">
          Something went wrong
        </h1>

        <Link
          href="/app"
          className="h-11 px-6 rounded-full bg-[#09090b] text-white text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:bg-[#27272a] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Go to home page</span>
        </Link>
      </div>
    </div>
  );
}
