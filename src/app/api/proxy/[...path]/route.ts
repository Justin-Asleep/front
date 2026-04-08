import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:8000";

type Params = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, { params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const { path } = await params;
  const search = request.nextUrl.search;
  const url = `${API_URL}/api/v1/${path.join("/")}${search}`;

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("Authorization", `Bearer ${token}`);

  const init: RequestInit = { method: request.method, headers };
  if (!["GET", "HEAD", "DELETE"].includes(request.method)) {
    init.body = await request.text();
  }

  const backendRes = await fetch(url, init);
  const data = await backendRes.json().catch(() => null);

  return NextResponse.json(data, { status: backendRes.status });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
