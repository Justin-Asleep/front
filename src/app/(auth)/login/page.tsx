"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="min-h-screen flex">
      {/* Left: Blue Branding Panel */}
      <div className="w-[600px] bg-[#2563eb] flex flex-col items-center justify-center text-white relative overflow-hidden flex-shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-[60px] -left-[80px] w-[300px] h-[300px] rounded-full bg-white/10" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full bg-white/10" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold mb-8">
            +
          </div>
          <h1 className="text-4xl font-bold mb-2">Vital Monitoring</h1>
          <p className="text-[#d9e5ff] text-base text-center mb-1">Hospital Patient Vital Sign</p>
          <p className="text-[#d9e5ff] text-base text-center mb-8">Real-time Monitoring System</p>

          <div className="w-[60px] h-[2px] bg-white/40 mb-8" />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="text-sm text-[#d9e5ff]">Real-time Vital Sign Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="text-sm text-[#d9e5ff]">Smart Alarm System</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="text-sm text-[#d9e5ff]">Multi-bed Dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f9fafb] relative">
        <div className="w-[400px] bg-white rounded-2xl shadow-[0px_4px_24px_0px_rgba(0,0,0,0.08)] px-10 pt-12 pb-10">
          <h2 className="text-[28px] font-bold text-center text-[#111827] mb-2">Login</h2>
          <p className="text-sm text-[#4b5563] text-center mb-8">Sign in to your admin account</p>

          <div className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#111827]">Email</label>
              <Input
                type="email"
                placeholder="admin@hospital.com"
                className="h-[44px] border-[#d1d5db] text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#111827]">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-[44px] border-[#d1d5db] text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Sign In Button */}
            <Button className="w-full h-[44px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-semibold rounded-lg mt-1">
              Sign In
            </Button>

            <p className="text-[13px] text-[#2563eb] text-center cursor-pointer hover:underline">
              Forgot your password?
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="absolute bottom-8 text-xs text-[#9ca3af]">
          &copy; 2026 Vital Monitoring System. All rights reserved.
        </p>
      </div>
    </div>
  )
}
