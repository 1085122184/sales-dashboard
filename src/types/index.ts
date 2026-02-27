// =====================
// 销售指标相关类型
// =====================

export interface SalesMetric {
  /** 指标名称 */
  label: string
  /** 主要数值（字符串格式，含单位） */
  value: string
  /** 预算比 (0~1) */
  budgetRatio: number
  /** 预算比显示值 */
  budgetRatioText: string
  /** 目标差距（万） */
  targetGap: number
  /** 本月目标（万） */
  monthTarget: number
  /** 差距文字颜色 */
  gapColor?: 'red' | 'green'
}

export interface CollectionMetric {
  /** 回款金额 */
  amount: string
  /** 回款率 (0~1) */
  rate: number
  /** 回款率显示文字 */
  rateText: string
  /** 目标差距（万） */
  targetGap: number
  /** 本月目标（万） */
  monthTarget: number
}

export interface OrderMetric {
  /** 标题 */
  title: string
  /** 数量 */
  count: number
  /** 占比 (0~1) */
  ratio: number
  /** 占比显示文字 */
  ratioText: string
  /** 进度条颜色 */
  color: string
}

// =====================
// 价格偏差相关类型
// =====================

export interface PriceDeviationItem {
  /** 产品名称 */
  product: string
  /** 七日平均价格（元） */
  sevenDayAvgPrice: number
  /** 当日平均价格（元） */
  todayAvgPrice: number
  /** 偏差金额 */
  deviationAmount: number
  /** 偏差率 */
  deviationRate: number
  /** 偏差率显示文字 */
  deviationRateText: string
  /** 是否告警（超过阈值高亮） */
  isAlert: boolean
}

// =====================
// API 请求相关类型（对接后台时使用）
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

/** 某产品某天的销售数据点 */
export interface SalesTrendPoint {
  date: string        // '02-07'
  volume: number      // 销量（吨）
  price: number       // 销售价格（元）
}

/** 单个产品的趋势汇总（供表格展示） */
export interface SalesTrendProduct {
  product: string
  latestDate: string
  latestVolume: number
  latestPrice: number
  /** 销量7日环比变化率（小数，如 -0.12 = -12%） */
  volumeChange: number
  /** 价格7日环比变化率 */
  priceChange: number
  /** 量价相关系数 -1~1（正值=量价同向，负值=量价背离） */
  correlation: number
  /** 趋势数据点列表 */
  trend: SalesTrendPoint[]
}
