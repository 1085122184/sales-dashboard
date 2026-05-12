
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// ==================== 销售相关类型 ====================
export interface SalesDetailRecord {
  id: string
  date: string
  businessDate?: string
  companyName?: string
  productCode: string
  productName: string
  groupName?: string
  region: string
  groupName?: string
  sales?: number | string
  amount?: number | string
  price?: number | string
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
