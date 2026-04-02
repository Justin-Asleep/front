"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getVisiblePages } from "@/helpers/pagination"

interface PaginationBarProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  label?: string
}

export function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  label = "items",
}: PaginationBarProps) {
  const start = (currentPage - 1) * pageSize

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e7eb]">
      <span className="text-sm text-[#6b7280]">
        Showing {totalItems === 0 ? 0 : start + 1}-{Math.min(start + pageSize, totalItems)} of {totalItems} {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="size-8 rounded flex items-center justify-center text-sm transition-colors bg-white border border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft className="size-4" />
        </button>
        {getVisiblePages(currentPage, totalPages).map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="size-8 flex items-center justify-center text-sm text-[#9ca3af]">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "size-8 rounded text-sm font-medium transition-colors",
                currentPage === page
                  ? "bg-[#2563eb] text-white"
                  : "bg-white border border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]"
              )}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="size-8 rounded flex items-center justify-center text-sm transition-colors bg-white border border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
