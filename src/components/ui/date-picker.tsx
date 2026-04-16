"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import type { Matcher } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// value/onChange는 로컬 기준 "YYYY-MM-DD" 문자열.
// Calendar는 Date 객체로 동작하므로 진입/이탈 시 변환한다.

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  /** 선택 가능한 마지막 날짜 (YYYY-MM-DD) */
  max?: string
  /** 선택 가능한 첫 날짜 (YYYY-MM-DD) */
  min?: string
  disabled?: boolean
  className?: string
}

function toYmd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function fromYmd(s: string | undefined): Date | undefined {
  if (!s) return undefined
  const [y, m, d] = s.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  max,
  min,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = React.useMemo(() => fromYmd(value), [value])
  const maxDate = React.useMemo(() => fromYmd(max), [max])
  const minDate = React.useMemo(() => fromYmd(min), [min])

  // react-day-picker v9 Matcher: before/after 구간으로 disable. 각 객체는 before 또는
  // after 하나만 갖는 DateBefore/DateAfter 형태여야 한다.
  const disabledMatcher = React.useMemo<Matcher | Matcher[] | undefined>(() => {
    const m: Matcher[] = []
    if (minDate) m.push({ before: minDate })
    if (maxDate) m.push({ after: maxDate })
    return m.length > 0 ? m : undefined
  }, [minDate, maxDate])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "inline-flex h-10 w-full items-center justify-between rounded-lg border border-[#d1d5db] bg-transparent px-3 py-1.5 text-left text-[14px] outline-none",
          "hover:border-[#9ca3af] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <span>{value || placeholder}</span>
        <CalendarIcon className="ml-2 size-4 shrink-0 opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? maxDate ?? new Date()}
          onSelect={(d) => {
            if (d) onChange?.(toYmd(d))
            setOpen(false)
          }}
          disabled={disabledMatcher}
          captionLayout="dropdown"
          // 100년 범위(일반적 DOB) — year dropdown으로 빠른 이동 가능
          startMonth={minDate ?? new Date(new Date().getFullYear() - 100, 0, 1)}
          endMonth={maxDate ?? new Date(new Date().getFullYear() + 10, 11, 1)}
        />
      </PopoverContent>
    </Popover>
  )
}
