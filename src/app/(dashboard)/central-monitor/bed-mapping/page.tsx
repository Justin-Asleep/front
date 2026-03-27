import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const AVAILABLE_BEDS = [
  { id: "301-1", patient: "Kim Minjun" },
  { id: "301-2", patient: "Park Soyeon" },
  { id: "301-3", patient: "Lee Jungho" },
  { id: "302-1", patient: "Choi Yuna" },
  { id: "302-2", patient: null },
  { id: "302-3", patient: "Jung Hyunwoo" },
  { id: "303-1", patient: "Kang Seojun" },
  { id: "303-2", patient: null },
];

const MONITOR_SLOTS = [
  { position: 1, bedId: "301-1", patient: "Kim Minjun" },
  { position: 2, bedId: "301-2", patient: "Park Soyeon" },
  { position: 3, bedId: "301-3", patient: "Lee Jungho" },
  { position: 4, bedId: null, patient: null },
  { position: 5, bedId: "302-1", patient: "Choi Yuna" },
  { position: 6, bedId: null, patient: null },
  { position: 7, bedId: "303-1", patient: "Kang Seojun" },
  { position: 8, bedId: null, patient: null },
];

export default function BedMappingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bed Mapping</h1>
        <p className="text-muted-foreground">Assign beds to monitor display positions</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* 좌측: Available Beds */}
        <Card className="w-[380px] h-[700px] rounded-xl shadow-sm flex flex-col">
          <CardContent className="p-5 flex flex-col gap-4 h-full">
            <div>
              <p className="text-[15px] font-semibold text-[#111827]">Available Beds</p>
              <p className="text-[12px] text-[#9ca3af] mt-0.5">Drag beds to monitor slots</p>
            </div>

            <Input
              placeholder="Search beds..."
              className="h-[32px] bg-[#f9fafb] border rounded-[6px] text-[13px]"
            />

            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {AVAILABLE_BEDS.map((bed) => (
                <div
                  key={bed.id}
                  className="flex items-center gap-3 h-[44px] bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] px-3"
                >
                  {/* 드래그 핸들 (시각적 mock) */}
                  <div className="flex gap-[4px] cursor-grab flex-shrink-0">
                    <div className="w-[4px] h-[16px] bg-[#9ca3af] rounded-[2px]" />
                    <div className="w-[4px] h-[16px] bg-[#9ca3af] rounded-[2px]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[13px] text-[#111827]">Bed {bed.id}</p>
                    {bed.patient ? (
                      <p className="text-[12px] text-[#4b5563]">{bed.patient}</p>
                    ) : (
                      <p className="text-[12px] text-[#9ca3af]">(Empty)</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 우측: Monitor Layout */}
        <Card className="flex-1 h-[700px] rounded-xl shadow-sm flex flex-col">
          <CardContent className="p-5 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-[#111827]">Monitor Layout</p>
              <Select defaultValue="icu">
                <SelectTrigger className="w-[220px] h-[32px] bg-[#f9fafb] border rounded-[6px] text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icu">ICU Monitor (6 beds)</SelectItem>
                  <SelectItem value="ward">Ward Monitor (8 beds)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4열 x 2행 슬롯 그리드 */}
            <div className="grid grid-cols-4 gap-3 flex-1">
              {MONITOR_SLOTS.map((slot) =>
                slot.bedId ? (
                  /* 매핑된 슬롯 */
                  <div
                    key={slot.position}
                    className="bg-[#f2f6fe] border border-[#2563eb] rounded-[10px] h-[144px] p-3 flex flex-col justify-between"
                  >
                    <p className="text-[#9ca3af] text-[11px] font-semibold">
                      Position {slot.position}
                    </p>
                    <div>
                      <p className="text-[#2563eb] text-[14px] font-semibold">Bed {slot.bedId}</p>
                      <p className="text-[#111827] text-[13px]">{slot.patient}</p>
                    </div>
                    <button className="text-[11px] bg-[#fef2f2] text-[#dc2626] rounded-[4px] px-2 py-1 w-fit">
                      Remove
                    </button>
                  </div>
                ) : (
                  /* 빈 슬롯 */
                  <div
                    key={slot.position}
                    className="bg-[#f9fafb] border border-dashed border-[#d1d5db] rounded-[10px] h-[144px] flex flex-col items-center justify-center gap-1"
                  >
                    <p className="text-[#9ca3af] text-[11px] font-semibold">
                      Position {slot.position}
                    </p>
                    <p className="text-[#9ca3af] text-[13px]">Drop bed here</p>
                  </div>
                )
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]">Save Mapping</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
