/**
 * Endpoints de autenticação consumidos pelo SPA do aluno.
 *
 * Backend aceita email OU username no `username` da request — o user só
 * precisa lembrar de um.
 */

import { api } from "./client";
import type { LoginRequest, LoginResponse, RefreshResponse, User } from "./types";

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const r = await api.post<LoginResponse>("/api/auth/login/", req, {
    headers: { "Content-Type": "application/json" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...({ _skipAuth: true } as any),
  });
  return r.data;
}

export async function refreshAccessToken(refresh: string): Promise<RefreshResponse> {
  const r = await api.post<RefreshResponse>(
    "/api/auth/refresh/",
    { refresh },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { ...({ _skipAuth: true } as any) },
  );
  return r.data;
}

export interface UpdateMeRequest {
  display_name?: string;
  email?: string;
  phone?: string;
  birth_date?: string | null;
}

export async function getMe(): Promise<User> {
  const r = await api.get<User>("/api/auth/me/");
  return r.data;
}

export async function updateMe(body: UpdateMeRequest): Promise<User> {
  const r = await api.patch<User>("/api/auth/me/", body);
  return r.data;
}

/** GET /api/auth/me/trainer/ — dados do personal vinculado ao aluno logado. */
export async function getMyTrainer(): Promise<User> {
  const r = await api.get<User>("/api/auth/me/trainer/");
  return r.data;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export async function changePassword(body: ChangePasswordRequest): Promise<void> {
  await api.post("/api/auth/change-password/", body);
}
