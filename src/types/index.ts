// src/types/index.ts




export interface CompanyMetricDetail {
  companyName: string  // 公司名称
  value: number        // 实际完成值
  target: number       // 目标值
  ratioText: string    // 达成率百分比文本
  isAlert?: boolean    // 是否标红预警
}
// =====================
// 销售指标相关类型
// =====================
export interface SalesMetric {
  label: string
  value: string
  budgetRatio: number
  budgetRatioText: string
  targetGap: number
  monthTarget: number
  gapColor?: 'red' | 'green'
}

export interface CollectionMetric {
  amount: string
  rate: number
  rateText: string
  targetGap: number
  monthTarget: number
}

export interface OrderMetric {
  title: string
  count: number
  ratio: number
  ratioText: string
  color: string
}

// =====================
// 价格偏差相关类型
// =====================
export interface PriceDeviationItem {
  productCode: string     // 🌟 物理主键：物料编码
  product: string         // 显示名称：物料名字
  region: string          // 🌟 市场区域：如 '国内' / '国外'
  sevenDayAvgPrice: number
  todayAvgPrice: number
  deviationAmount: number
  deviationRate: number
  deviationRateText: string
  isAlert: boolean
}

export interface PriceDeviationDetail {
  customer: string
  volume: number
  price: number
}

// =====================
// API 请求相关类型
// =====================
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface DashboardData {
  salesVolume: SalesMetric
  salesAmount: SalesMetric
  collection: CollectionMetric
  monthOrders: OrderMetric
  yearOrders: OrderMetric
  priceDeviations: PriceDeviationItem[]
}

// =====================
// 销售趋势相关类型
// =====================
export interface SalesTrendPoint {
  date: string
  volume: number
  price: number
}

export interface SalesTrendProduct {
  productCode: string
  product: string
  region: string
  latestDate: string
  latestVolume: number
  latestPrice: number
  volumeChange: number
  priceChange: number
  correlation: number
  trend: SalesTrendPoint[]
}