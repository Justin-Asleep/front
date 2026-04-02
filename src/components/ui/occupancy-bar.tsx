import { cn } from "@/lib/utils"

export function OccupancyBar({ value, className }: { value: number; className?: string }) {
  const opacity = 0.3 + (value / 100) * 0.7

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 rounded-full bg-[#f3f4f6] overflow-hidden", className ?? "w-[100px]")}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            backgroundColor: `rgba(37, 99, 235, ${opacity})`,
          }}
        />
      </div>
      <span className="text-[12px] font-medium text-[#4b5563]">{value}%</span>
    </div>
  )
}
