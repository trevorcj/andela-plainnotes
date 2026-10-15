import React from 'react';

export default function Loading() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#09090b]">
      {/* Sidebar Skeleton */}
      <div className="hidden sm:flex flex-col w-[260px] h-full bg-[#f9f9f9] border-r border-[#e4e4e7] p-3 gap-3 animate-pulse">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 py-2">
          <div className="h-6 w-24 bg-neutral-200 rounded-[6px]" />
          <div className="h-6 w-6 bg-neutral-200 rounded-[6px]" />
        </div>

        {/* Action Button */}
        <div className="h-9 w-full bg-neutral-200 rounded-lg mt-2" />

        {/* History items */}
        <div className="flex flex-col gap-2 mt-4">
          <div className="h-3 w-16 bg-neutral-200 rounded ml-2" />
          <div className="h-8 w-full bg-neutral-200/70 rounded-lg" />
          <div className="h-8 w-full bg-neutral-200/70 rounded-lg" />
          <div className="h-8 w-full bg-neutral-200/70 rounded-lg" />
          <div className="h-8 w-full bg-neutral-200/70 rounded-lg" />
        </div>

        {/* Bottom user profile skeleton */}
        <div className="mt-auto h-12 w-full bg-neutral-200/80 rounded-lg" />
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-pulse">
        <div className="w-full max-w-[720px] flex flex-col items-center gap-6">
          {/* Centered Title Skeleton */}
          <div className="h-8 w-72 bg-neutral-200 rounded-lg mb-2" />

          {/* Floating Input Skeleton */}
          <div className="w-full h-14 bg-white border border-[#e4e4e7] rounded-[28px] px-4 flex items-center justify-between">
            <div className="h-7 w-7 rounded-full bg-neutral-200" />
            <div className="h-4 w-64 bg-neutral-200/80 rounded" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 rounded bg-neutral-200/60" />
              <div className="h-7 w-7 rounded-full bg-neutral-200" />
            </div>
          </div>

          {/* Suggestions Skeleton */}
          <div className="w-full flex flex-col gap-2.5 mt-2">
            <div className="h-9 w-full rounded-full bg-neutral-100" />
            <div className="h-9 w-full rounded-full bg-neutral-100" />
            <div className="h-9 w-full rounded-full bg-neutral-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
