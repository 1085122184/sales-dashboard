import http from './http'
import type {
  ApiResponse,
  DingTalkBridgeResponse,
  DingTalkLoginRequest,
  LoginRequest,
  LoginResponse,
  LoginTicketRequest
} from '@/types'

export const login = async (data: LoginRequest) => {
  const res = await http.post<any, ApiResponse<LoginResponse>>('/v1/auth/login', data)
  return res
}

export const loginByDingTalk = async (data: DingTalkLoginRequest) => {
  const res = await http.post<any, ApiResponse<LoginResponse>>('/v1/auth/dingtalk/login', data)
  return res
}

export const createPcDingTalkBridgeLogin = async (data: DingTalkLoginRequest, redirect?: string) => {
  const res = await http.post<any, ApiResponse<DingTalkBridgeResponse>>('/v1/auth/dingtalk/bridge-login', data, {
    params: { redirect }
  })
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
