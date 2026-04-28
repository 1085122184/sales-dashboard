import http from './http'
import type { ApiResponse } from '@/types'

/**
 * 三费监控 API
 */

// ==================== 类型定义 ====================

export interface BudgetExecutionRecord {
  companyName: string
  salesActual: number
  salesBudget: number
  mgmtActual: number
  mgmtBudget: number
  finActual: number
  finBudget: number
}

export interface BudgetExecutionParams {
  date: string
  dimension: 'month' | 'year'
}

export interface BudgetExecutionResult {
  companyName: string
  salesActual: number
  salesBudget: number
  mgmtActual: number
  mgmtBudget: number
  finActual: number
  finBudget: number
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

export interface ExpenseDailyDetailResult {
  companyName: string
  types: string
  amount: number
  text: string
}

// ==================== 接口定义 ====================

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

/** 6. 获取指定公司某天的三费明细台账 */
export async function getExpenseDailyDetail(params: ExpenseDailyDetailParams): Promise<ExpenseDailyDetailResult[]> {
  const res = await http.get<ExpenseDailyDetailParams, ApiResponse<ExpenseDailyDetailResult[]>>('/expense/daily-detail', { params })
  return res.data || []
}

/** 7. 获取分公司各维度预算执行监控数据 */
export async function getBudgetExecution(params: BudgetExecutionParams): Promise<BudgetExecutionResult[]> {
  const res = await http.get<BudgetExecutionParams, ApiResponse<BudgetExecutionResult[]>>('/expense/budget-execution', { params })
  return res.data || []
}

/** 8. 获取各公司同环比分析数据 */
export interface CompanyGrowthPoint {
  companyName: string
  currentValue: number    // 本期值(万)
  yoyValue: number        // 去年同期值(万)
  momValue: number        // 上期环比值(万)
  yoy: number             // 同比增长率 %
  mom: number             // 环比增长率 %
}

export async function getCompanyGrowthData(params?: { date: string }): Promise<CompanyGrowthPoint[]> {
  const res = await http.get<any, ApiResponse<CompanyGrowthPoint[]>>('/expense/growth', { params })
  return res.data || []
}