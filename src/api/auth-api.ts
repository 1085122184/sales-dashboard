import http from './http'
import type {
  ApiResponse,
  DingTalkLoginRequest,
  LoginRequest,
  LoginResponse,
  LoginTicketRequest,
  LoginTicketResponse
} from '@/types'

export const login = async (data: LoginRequest) => {
  const res = await http.post<any, ApiResponse<LoginResponse>>('/v1/auth/login', data)
  return res
}

export const loginByDingTalk = async (data: DingTalkLoginRequest) => {
  const res = await http.post<any, ApiResponse<LoginResponse>>('/v1/auth/dingtalk/login', data)
  return res
}

export const createLoginTicket = async () => {
  const res = await http.post<any, ApiResponse<LoginTicketResponse>>('/v1/auth/login-ticket')
  return res
}

export const consumeLoginTicket = async (data: LoginTicketRequest) => {
  const res = await http.post<any, ApiResponse<LoginResponse>>('/v1/auth/login-ticket/consume', data)
  return res
}

export const logout = async () => {
  const res = await http.post<any, ApiResponse<boolean>>('/v1/auth/logout')
  return res
}
