'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function SearchPagination({ currentPage, totalPages, onPageChange }: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  // Build visible page numbers (max 5 around current page)
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    // Ensure we always show up to 5 pages
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(totalPages, start + 4);
      } else if (end === totalPages) {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
          currentPage <= 1
            ? 'border-[#27272A] text-[#A1A1AA] cursor-not-allowed'
            : 'border-[#27272A] text-[#52525B] hover:border-[#3F3F46] hover:text-white'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Précédent</span>
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#27272A] text-[#71717A] hover:border-[#3F3F46] hover:text-white text-sm transition-all"
            >
              1
            </button>
            {pages[0] > 2 && (
              <span className="w-9 h-9 flex items-center justify-center text-[#A1A1AA] text-sm">...</span>
            )}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-all ${
              page === currentPage
                ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                : 'border-[#27272A] text-[#71717A] hover:border-[#3F3F46] hover:text-white'
            }`}
          >
            {page}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="w-9 h-9 flex items-center justify-center text-[#A1A1AA] text-sm">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#27272A] text-[#71717A] hover:border-[#3F3F46] hover:text-white text-sm transition-all"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
          currentPage >= totalPages
            ? 'border-[#27272A] text-[#A1A1AA] cursor-not-allowed'
            : 'border-[#27272A] text-[#52525B] hover:border-[#3F3F46] hover:text-white'
        }`}
      >
        <span className="hidden sm:inline">Suivant</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
