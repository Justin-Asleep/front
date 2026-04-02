import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/services/cookie-config";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
  }

  const backendRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    // Refresh failed — clear cookies
    cookieStore.set("access_token", "", { maxAge: 0, path: "/" });
    cookieStore.set("refresh_token", "", { maxAge: 0, path: "/" });
    return NextResponse.json(data, { status: 401 });
  }

  const { access_token, refresh_token: newRefreshToken } = data.data;

  cookieStore.set("access_token", access_token, ACCESS_TOKEN_COOKIE);
  cookieStore.set("refresh_token", newRefreshToken, REFRESH_TOKEN_COOKIE);

  return NextResponse.json({ success: true });
}
