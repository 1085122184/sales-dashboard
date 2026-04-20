import http from './http'
import type { ApiResponse } from '@/types'

/**
 * 三费监控 API
 */

/** 1. 获取三费总览指标 */
export async function getExpenseOverview(date?: string) {
  const res = await http.get<any, ApiResponse<any>>('/expense/overview', { params: { date } })
  return res.data || null
}

/** 2. 获取各公司三费对比数据 */
export async function getExpenseCompanyComparison(date?: string) {
  const res = await http.get<any, ApiResponse<any[]>>('/expense/company-comparison', { params: { date } })
  return res.data || []
}

/** 3. 获取费用结构数据 */
export async function getExpenseStructure(date?: string, year?: number) {
  const res = await http.get<any, ApiResponse<any[]>>('/expense/structure', { params: { date, year } })
  return res.data || []
}

/** 4. 获取三费趋势数据（近12个月） */
export async function getExpenseTrend(date?: string) {
  const res = await http.get<any, ApiResponse<any>>('/expense/trend', { params: { date } })
  return res.data || null
}

/** 5. 获取各公司三费明细列表 */
export async function getExpenseCompanyDetail(params?: {
  date?: string
  keyword?: string
  page?: number
  pageSize?: number
}) {
  const res = await http.get<any, ApiResponse<any>>('/expense/company-detail', { params })
  return res.data || { list: [], total: 0, page: 1, pageSize: 10 }
}
