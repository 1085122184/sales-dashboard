export interface LoginRequest {
  username: string
  password: string
}

export interface DingTalkLoginRequest {
  authCode: string
}

export interface LoginTicketRequest {
  ticket: string
}

export interface LoginTicketResponse {
  ticket: string
  expiresIn: number
}

export interface LoginUserInfo {
  userId: number
  username: string
  nickname?: string
  status?: number
}

export interface LoginResponse {
  accessToken: string
  tokenType?: string
  expiresIn?: number
  refreshToken?: string
  userInfo: LoginUserInfo
  roles: string[]
  permissions: string[]
}
