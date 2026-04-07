export type WardStatus = "Active" | "Inactive"
export type RoomType = "SINGLE" | "DOUBLE" | "QUAD" | "HEX"

export type Ward = {
  id: string
  name: string
  floor: string
  rooms: number
  beds: number
  occupancy: number
  status: WardStatus
}

export type Room = {
  room: string
  ward: string
  type: RoomType
  beds: number
  occupied: number
  available: number
  status: "Active" | "Inactive"
}

export const initialWards: Ward[] = [
  { id: "1", name: "Internal Medicine", floor: "3F", rooms: 8,  beds: 32, occupancy: 75, status: "Active" },
  { id: "2", name: "Surgery",           floor: "4F", rooms: 6,  beds: 24, occupancy: 83, status: "Active" },
  { id: "3", name: "Pediatrics",        floor: "2F", rooms: 5,  beds: 20, occupancy: 60, status: "Active" },
  { id: "4", name: "ICU",               floor: "5F", rooms: 4,  beds: 16, occupancy: 94, status: "Active" },
  { id: "5", name: "Emergency",         floor: "1F", rooms: 3,  beds: 12, occupancy: 67, status: "Active" },
  { id: "6", name: "Rehabilitation",    floor: "6F", rooms: 4,  beds: 16, occupancy: 50, status: "Inactive" },
]

export const allRooms: Room[] = [
  { room: "Room 301", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 302", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 4, available: 0, status: "Active" },
  { room: "Room 303", ward: "Internal Medicine", type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 304", ward: "Internal Medicine", type: "HEX",    beds: 6, occupied: 5, available: 1, status: "Active" },
  { room: "Room 305", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 306", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 4, available: 0, status: "Active" },
  { room: "Room 307", ward: "Internal Medicine", type: "HEX",    beds: 6, occupied: 3, available: 3, status: "Inactive" },
  { room: "Room 308", ward: "Internal Medicine", type: "SINGLE", beds: 1, occupied: 0, available: 1, status: "Active" },
  { room: "Room 401", ward: "Surgery",           type: "QUAD",   beds: 4, occupied: 4, available: 0, status: "Active" },
  { room: "Room 402", ward: "Surgery",           type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 403", ward: "Surgery",           type: "HEX",    beds: 6, occupied: 6, available: 0, status: "Active" },
  { room: "Room 404", ward: "Surgery",           type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 405", ward: "Surgery",           type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 406", ward: "Surgery",           type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 201", ward: "Pediatrics",        type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 202", ward: "Pediatrics",        type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 203", ward: "Pediatrics",        type: "HEX",    beds: 6, occupied: 3, available: 3, status: "Active" },
  { room: "Room 204", ward: "Pediatrics",        type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 205", ward: "Pediatrics",        type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 501", ward: "ICU",               type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 502", ward: "ICU",               type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 503", ward: "ICU",               type: "QUAD",   beds: 4, occupied: 4, available: 0, status: "Active" },
  { room: "Room 504", ward: "ICU",               type: "HEX",    beds: 6, occupied: 6, available: 0, status: "Active" },
  { room: "Room 101", ward: "Emergency",         type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 102", ward: "Emergency",         type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 103", ward: "Emergency",         type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 601", ward: "Rehabilitation",    type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 602", ward: "Rehabilitation",    type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 603", ward: "Rehabilitation",    type: "HEX",    beds: 6, occupied: 3, available: 3, status: "Active" },
  { room: "Room 604", ward: "Rehabilitation",    type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Inactive" },
]
