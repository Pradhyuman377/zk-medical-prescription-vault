import React from 'react';

export function SkeletonText({ className = "h-4 w-full" }) {
  return (
    <div className={`rounded bg-slate-800/80 animate-pulse ${className}`} />
  );
}

export function SkeletonCard({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 w-2/3">
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-850 rounded w-1/2"></div>
            </div>
            <div className="h-5 w-16 bg-slate-800 rounded-full"></div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-900">
            <div className="flex justify-between">
              <div className="h-3 bg-slate-800 rounded w-16"></div>
              <div className="h-3 bg-slate-800 rounded w-24"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-slate-800 rounded w-20"></div>
              <div className="h-3 bg-slate-800 rounded w-28"></div>
            </div>
          </div>

          <div className="h-8 bg-slate-900 rounded-lg"></div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="h-8 bg-slate-800 rounded-xl"></div>
            <div className="h-8 bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4, cols = 5 }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
        <div className="h-3 bg-slate-800 rounded w-32 animate-pulse"></div>
        <div className="h-3 bg-slate-800 rounded w-24 animate-pulse"></div>
      </div>
      <div className="divide-y divide-slate-800/60 bg-slate-900/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center justify-between gap-4 animate-pulse">
            <div className="h-3.5 bg-slate-800 rounded w-28"></div>
            <div className="h-3 bg-slate-850 rounded w-20 hidden sm:block"></div>
            <div className="h-3 bg-slate-850 rounded w-32 font-mono hidden md:block"></div>
            <div className="h-5 bg-slate-800 rounded-full w-16"></div>
            <div className="h-7 bg-slate-800 rounded-lg w-28"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default { SkeletonCard, SkeletonTable, SkeletonText };
