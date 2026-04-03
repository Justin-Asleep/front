"use client"

import * as React from "react"
import { Combobox } from "@base-ui/react/combobox"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, Search } from "lucide-react"

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className,
  disabled = false,
}: SearchableSelectProps) {
  const selectedOption = options.find((o) => o.value === value) ?? null

  return (
    <Combobox.Root
      value={selectedOption}
      onValueChange={(val) => {
        if (val) onValueChange((val as SearchableSelectOption).value)
      }}
      items={options}
      itemToStringLabel={(item) => (item as SearchableSelectOption).label}
      disabled={disabled}
    >
      <Combobox.Trigger
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 h-10 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground",
          className
        )}
      >
        <span className="flex flex-1 text-left text-sm truncate">
          <Combobox.Value placeholder={placeholder} />
        </span>
        <Combobox.Icon
          render={
            <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
          }
        />
      </Combobox.Trigger>

      <Combobox.Portal>
        <Combobox.Positioner
          side="bottom"
          sideOffset={4}
          className="isolate z-50"
        >
          <Combobox.Popup className="w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-3 py-2">
              <Search className="size-4 text-[#9ca3af] shrink-0" />
              <Combobox.Input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search..."
              />
            </div>

            <Combobox.List className="max-h-[200px] overflow-y-auto p-1 scroll-my-1">
              {(option: SearchableSelectOption) => (
                <Combobox.Item
                  value={option}
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  <span className="flex flex-1 shrink-0 whitespace-nowrap">
                    {option.label}
                  </span>
                  <Combobox.ItemIndicator
                    render={
                      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
                    }
                  >
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>

            <Combobox.Empty className="py-4 text-center text-sm text-muted-foreground">
              No results found
            </Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
