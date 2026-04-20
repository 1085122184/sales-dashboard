/**
 * ============================================================
 * 通用工具函数库
 * ============================================================
 * 提供常用的格式化、计算、防抖节流等工具函数
 * 
 * @example
 * import { formatNumber, formatPercent, debounce } from '@/utils'
 */

/**
 * 格式化数字为千分位
 */
export function formatNumber(num: number | string, options?: {
  decimals?: number
  prefix?: string
  suffix?: string
}): string {
  const value = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(value)) return '0'
  
  const { 
    decimals = 2, 
    prefix = '', 
    suffix = '' 
  } = options || {}
  
  const formatted = value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  
  return `${prefix}${formatted}${suffix}`
}

/**
 * 格式化大数字（万、亿）
 */
export function formatLargeNumber(num: number): string {
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  
  if (abs >= 100000000) {
    return `${sign}${(abs / 100000000).toFixed(2)}亿`
  }
  if (abs >= 10000) {
    return `${sign}${(abs / 10000).toFixed(2)}万`
  }
  return `${sign}${abs.toLocaleString('zh-CN')}`
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化货币
 */
export function formatCurrency(amount: number, currency = '¥'): string {
  return `${currency}${formatNumber(amount)}`
}

/**
 * 计算增长率
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0
  return (current - previous) / previous
}

/**
 * 计算达成率
 */
export function calculateAchievementRate(actual: number, target: number): number {
  if (target === 0) return 0
  return actual / target
}

/**
 * 计算差值
 */
export function calculateGap(actual: number, target: number): number {
  return actual - target
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 深拷贝（简单实现，复杂场景建议使用 structuredClone）
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (obj instanceof Object) {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        (clonedObj as any)[key] = deepClone((obj as any)[key])
      }
    }
    return clonedObj
  }
  return obj
}

/**
 * 生成唯一 ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 判断是否为空值
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 安全获取对象属性值
 */
export function safeGet<T extends object, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (!obj) return defaultValue
  return obj[key] ?? defaultValue
}

/**
 * 格式化日期字符串
 */
export function formatDate(date: Date | string | number, format = 'YYYY-MM-DD'): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取相对时间描述
 */
export function getRelativeTime(date: Date | string | number): string {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return formatDate(target, 'YYYY-MM-DD')
}

/**
 * 🛡️ 安全的 HTML 转义函数：防止 XSS 攻击
 * 将 HTML 特殊字符转义为实体
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return str.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * 🛡️ 安全的 HTML 清洗器：只允许安全的标签和属性
 * 简单实现：移除危险标签和属性（on* 事件、javascript: 协议等）
 */
export function sanitizeHtml(html: string): string {
  // 移除所有 on* 事件处理程序
  let cleaned = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  // 移除 javascript: 和 vbscript: 协议
  cleaned = cleaned.replace(/javascript\s*:/gi, '').replace(/vbscript\s*:/gi, '')
  // 移除 <script> 标签及其内容
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // 移除 <iframe> 标签
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  // 移除 <object> 和 <embed> 标签
  cleaned = cleaned.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
  return cleaned
}

/**
 * 📱 检测是否为移动设备（屏幕宽度 <= 767px）
 * 注意：这是非响应式的瞬时检测，适用于一次性判断
 * 如需响应式检测，请使用 @/composables/useBreakpoint
 */
export function isMobile(): boolean {
  return window.innerWidth <= 767
}

/**
 * 📱 响应式移动设备检测（需要 @vueuse/core）
 * @deprecated 请使用 useBreakpoint() 替代
 */
export const MOBILE_BREAKPOINT = 767

/**
 * 📐 统一断点系统
 * @deprecated 请使用 useBreakpoint() 替代
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const
