// Server Component
import { type Account, AccountsClient } from "./accounts-client"

const mockAccounts: Account[] = [
  { id: "1",  name: "Dr. Kim Minjun",  email: "kim.mj@hospital.com",   role: "Admin",  status: "Active",   createdAt: "2026-01-15" },
  { id: "2",  name: "Park Soyeon",     email: "park.sy@hospital.com",  role: "Nurse",  status: "Active",   createdAt: "2026-02-01" },
  { id: "3",  name: "Lee Jihoon",      email: "lee.jh@hospital.com",   role: "Doctor", status: "Active",   createdAt: "2026-02-10" },
  { id: "4",  name: "Choi Yuna",       email: "choi.yn@hospital.com",  role: "Nurse",  status: "Active",   createdAt: "2026-02-20" },
  { id: "5",  name: "Jung Doyoon",     email: "jung.dy@hospital.com",  role: "Doctor", status: "Inactive", createdAt: "2026-03-01" },
  { id: "6",  name: "Kang Haein",      email: "kang.he@hospital.com",  role: "Nurse",  status: "Active",   createdAt: "2026-03-05" },
  { id: "7",  name: "Yoon Seojin",     email: "yoon.sj@hospital.com",  role: "Admin",  status: "Active",   createdAt: "2026-03-10" },
  { id: "8",  name: "Hwang Jiwoo",     email: "hwang.jw@hospital.com", role: "Doctor", status: "Active",   createdAt: "2026-03-15" },
  { id: "9",  name: "Son Minji",       email: "son.mj@hospital.com",   role: "Nurse",  status: "Active",   createdAt: "2026-03-16" },
  { id: "10", name: "Lim Chanwoo",     email: "lim.cw@hospital.com",   role: "Doctor", status: "Active",   createdAt: "2026-03-17" },
  { id: "11", name: "Oh Jiyeon",       email: "oh.jy@hospital.com",    role: "Admin",  status: "Inactive", createdAt: "2026-03-18" },
  { id: "12", name: "Bae Sunghoon",    email: "bae.sh@hospital.com",   role: "Nurse",  status: "Active",   createdAt: "2026-03-19" },
  { id: "13", name: "Shin Hyunwoo",    email: "shin.hw@hospital.com",  role: "Doctor", status: "Active",   createdAt: "2026-03-20" },
  { id: "14", name: "Han Jisoo",       email: "han.js@hospital.com",   role: "Nurse",  status: "Active",   createdAt: "2026-03-21" },
  { id: "15", name: "Ko Eunji",        email: "ko.ej@hospital.com",    role: "Doctor", status: "Active",   createdAt: "2026-03-22" },
  { id: "16", name: "Jeon Hyebin",     email: "jeon.hb@hospital.com",  role: "Admin",  status: "Active",   createdAt: "2026-03-23" },
  { id: "17", name: "Moon Sehun",      email: "moon.sh@hospital.com",  role: "Nurse",  status: "Inactive", createdAt: "2026-03-24" },
  { id: "18", name: "Ryu Jeonghoon",   email: "ryu.jh@hospital.com",   role: "Doctor", status: "Active",   createdAt: "2026-03-25" },
  { id: "19", name: "Nam Dawon",       email: "nam.dw@hospital.com",   role: "Nurse",  status: "Active",   createdAt: "2026-03-25" },
  { id: "20", name: "Yoo Jaehyun",     email: "yoo.jh@hospital.com",   role: "Doctor", status: "Active",   createdAt: "2026-03-26" },
  { id: "21", name: "Kwon Nara",       email: "kwon.nr@hospital.com",  role: "Nurse",  status: "Active",   createdAt: "2026-03-26" },
  { id: "22", name: "Cha Eunwoo",      email: "cha.ew@hospital.com",   role: "Admin",  status: "Active",   createdAt: "2026-03-26" },
  { id: "23", name: "Woo Joohyun",     email: "woo.jh@hospital.com",   role: "Doctor", status: "Active",   createdAt: "2026-03-27" },
  { id: "24", name: "Im Nayeon",       email: "im.ny@hospital.com",    role: "Nurse",  status: "Active",   createdAt: "2026-03-27" },
]

export default function AccountsPage() {
  // 향후: const accounts = await fetchAccounts()
  const accounts = mockAccounts
  return <AccountsClient initialAccounts={accounts} />
}
