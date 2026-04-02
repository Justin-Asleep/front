import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    if (payload.exp * 1000 < Date.now()) {
      return NextResponse.json({ detail: "Token expired" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payload.sub,
        role: payload.role,
        hospital_id: payload.hospital_id,
      },
      message: null,
    });
  } catch {
    return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
  }
}
