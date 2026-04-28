
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// ==================== 销售相关类型 ====================
export interface SalesDetailRecord {
  id: string
  date: string
  productCode: string
  productName: string
  region: string
  salesVolume: number
  salesAmount: number
  budgetVolume: number
  budgetAmount: number
  targetVolume: number
  targetAmount: number
  achievedVolume: number
  achievedAmount: number
}

export interface SalesDetailQueryParams {
  date?: string
  productCode?: string
  region?: string
  keyword?: string
  page?: number
  pageSize?: number
}
