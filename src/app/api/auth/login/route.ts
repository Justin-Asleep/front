import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/services/cookie-config";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendRes = await fetch(`${API_URL}/api/v1/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const { access_token, refresh_token } = data.data;

  // Decode JWT payload to extract user info (signature verified by backend, not here)
  const payload = JSON.parse(
    Buffer.from(access_token.split(".")[1], "base64").toString()
  );

  const cookieStore = await cookies();
  cookieStore.set("access_token", access_token, ACCESS_TOKEN_COOKIE);
  cookieStore.set("refresh_token", refresh_token, REFRESH_TOKEN_COOKIE);

  return NextResponse.json({
    success: true,
    data: {
      id: payload.sub,
      role: payload.role,
      hospital_id: payload.hospital_id,
    },
    message: null,
  });
}
