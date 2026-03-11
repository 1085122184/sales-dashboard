/**
 * ============================================================
 * http.ts — Axios 封装层
 * ============================================================
 *
 * 职责：统一处理请求基础配置、Token 注入、响应拦截、错误提示
 *
 * 📌 【Nginx 部署架构下的 baseURL 规范】
 * 无论开发还是生产，baseURL 都应保持为相对路径前缀（如 '/api'）。
 * - 开发环境：通过 vite.config.ts 的 proxy 拦截 '/api' 转发给本地后端。
 * - 生产环境：通过 Nginx 的 location /api/ 拦截转发给 Docker 内的后端容器。
 * ⚠️ 严禁在此处或 .env 中配置完整的带 http:// 的绝对路径，否则会引发跨域！
 * ============================================================
 */

import axios, { type AxiosResponse } from 'axios'

// ─── 基础配置 ─────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TIMEOUT  = 15_000  // 15 秒超时

// ─── 创建实例 ──────────────────────────────────────────────────
const http = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── 请求拦截器：注入 Token ────────────────────────────────────
http.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 Token（可改为 Pinia store / cookie）
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── 响应拦截器：统一解包 & 错误处理 ──────────────────────────
http.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 后台约定：code === 0 或 200 为成功（可根据实际后台调整）
    if (res.code !== 0 && res.code !== 200) {
      // 业务错误：统一抛出，让调用方的 catch 接住
      return Promise.reject(new Error(res.message ?? '请求失败'))
    }

    return res  // 返回完整的 { code, message, data }
  },
  (error) => {
    // HTTP 层错误（网络断开、4xx、5xx 等）
    const status = error.response?.status
    const msgMap: Record<number, string> = {
      401: '登录已过期，请重新登录',
      403: '没有操作权限',
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
