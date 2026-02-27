/**
 * ============================================================
 * http.ts — Axios 封装层
 * ============================================================
 *
 * 职责：统一处理请求基础配置、Token 注入、响应拦截、错误提示
 *
 * 📌 修改 baseURL 的三种方式：
 *   1. 直接修改下方 BASE_URL 常量（最简单）
 *   2. 在项目根目录 .env.production 中写 VITE_API_BASE_URL=https://api.example.com
 *   3. 通过 vite.config.ts 的 proxy 配置代理到后台（开发阶段推荐）
 * ============================================================
 */

import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

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
