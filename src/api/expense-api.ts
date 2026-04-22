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


export interface ExpenseDailyDetailParams {
  companyName: string
  date: string // 格式: YYYY-MM-DD
}

export interface ExpenseDailyDetailRecord {
  COMPANY_NAME: string
  TYPES: string
  AMOUNT: number
  TEXT: string
}

/**
 * 获取指定公司某天的三费明细台账
 * @param params { companyName, date }
 */
export function getExpenseDailyDetail(params: ExpenseDailyDetailParams) {
  // 注意：这里需要通过 .then(res => res.data) 来提取真正的数组内容
  return http.get<any, any>('/expense/daily-detail', { params })
    .then(res => {
      // 这里的 res 通常是 axios 拦截器处理后的结果
      // 如果拦截器没处理，则是 res.data.data；如果处理了，则是 res.data
      return res.data || []; 
    });
}

export interface BudgetExecutionRecord {
  companyName: string
  salesActual: number
  salesBudget: number
  mgmtActual: number
  mgmtBudget: number
  finActual: number
  finBudget: number
}

/** * 6. 获取分公司各维度预算执行监控数据 
 * @param params { date, dimension }
 */
export async function getBudgetExecution(params: { date: string; dimension: 'month' | 'year' }) {
  const res = await http.get<any, ApiResponse<BudgetExecutionRecord[]>>('/expense/budget-execution', { params })
  return res.data || []
}