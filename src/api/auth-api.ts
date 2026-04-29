import http from './http'
import type { ApiResponse, LoginRequest, LoginResponse } from '@/types'

export const login = async (data: LoginRequest) => {
  const res = await http.post<any, ApiResponse<LoginResponse>>('/v1/auth/login', data)
  return res
}

export const logout = async () => {
  const res = await http.post<any, ApiResponse<boolean>>('/v1/auth/logout')
  return res
}
