import axios, { type AxiosResponse } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TIMEOUT = 60_000

const STORAGE_KEYS = ['access_token', 'refresh_token', 'user_info', 'permissions', 'roles']

const http = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

function clearLocalAuth() {
  STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
}

function redirectTo(target: '/login' | '/403') {
  if (typeof window === 'undefined') return

  const currentPath = window.location.pathname
  const currentQuery = window.location.search
  const currentFullPath = `${currentPath}${currentQuery}`

  if (target === '/login') {
    if (!currentPath.startsWith('/login')) {
      window.location.href = `/login?redirect=${encodeURIComponent(currentFullPath)}`
    }
    return
  }

  if (!currentPath.startsWith('/403')) {
    window.location.href = `/403?from=${encodeURIComponent(currentFullPath)}`
  }
}

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

http.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    if (res.code === 401) {
      clearLocalAuth()
      redirectTo('/login')
      return Promise.reject(new Error(res.message ?? '登录已过期，请重新登录'))
    }

    if (res.code === 403) {
      redirectTo('/403')
      return Promise.reject(new Error(res.message ?? '没有权限访问当前资源'))
    }

    if (res.code !== 0 && res.code !== 200) {
      return Promise.reject(new Error(res.message ?? '请求失败'))
    }

    return res
  },
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      clearLocalAuth()
      redirectTo('/login')
    }

    if (status === 403) {
      redirectTo('/403')
    }

    const msgMap: Record<number, string> = {
      401: '登录已过期，请重新登录',
      403: '没有权限访问当前资源',
      404: '接口不存在',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务暂时不可用',
    }

    const message = msgMap[status] ?? error.message ?? '网络异常'
    return Promise.reject(new Error(message))
  },
)

export default http
