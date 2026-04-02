export type UserRole = "SUPER_ADMIN" | "ADMIN" | "NURSE" | "DOCTOR";

export interface User {
  id: string;
  role: UserRole;
  hospital_id: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Backend APIResponse 구조
export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
}

// JWT payload — Route Handler 서버사이드 전용 (client에서 직접 사용 안 함)
export interface TokenPayload {
  sub: string;
  role: UserRole;
  hospital_id: string | null;
  exp: number;
}

// Backend login/refresh 응답 — Route Handler 서버사이드 전용
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
