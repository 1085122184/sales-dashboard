// src/types/index.ts


export interface CompanySummaryMetric {
  companyName: string
  value: number
  target: number
  ratioText: string
  isAlert: boolean
  trend: number[]
}

export interface CompanyDetailData {
  products: {
     productCode: string;
     productName: string;
     region?: string;
     value: number; 
     percentage: number
     }[]
  dailySales: number[]
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
  type?: 'volume' | 'amount'
}

export interface CollectionMetric {
  label: string
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
  trendYear?: { date: string, volume: number, price: number }[]
}

// =====================
// 三级页面：产品深度穿透相关类型
// =====================
export interface ProductDeepKPI {
  totalVolume: number       // 累计销量
  domesticVolume?: number   // 国内销量
  intlVolume?: number       // 国外销量
  totalAmount?: number      // 累计销售额
  domesticAmount?: number   // 国内销售额
  intlAmount?: number       // 国外销售额
  avgPrice: number          // 均价
  domesticAvgPrice?: number // 国内均价
  intlAvgPrice?: number     // 国外均价
  profitEst: string         // 利润估算 (如 "+12.5%")
}

export interface ProductDeepTrend {
  date: string              // 日期 (如 03-01 或 2026-01)
  domesticVolume: number    // 国内销量
  intlVolume: number        // 国外销量
  amount: number            // 销售额
}

export interface ProductDeepCustomer {
  name: string              // 客户名
  volume: number   //采购量
  amount:number         // 销售额
}

// 抽屉整体返回结构
export interface ProductDeepDetail {
  kpi: ProductDeepKPI
  trend: ProductDeepTrend[]
  topCustomers: ProductDeepCustomer[]
}

// =====================
// 订单明细相关类型
// =====================
export interface OrderRecord {
  orderDate: string           
  orderNo: string        
  materialDesc: string   
  deliveryStatus: string  
  salesOrg: string        
  office: string         
  salesPerson: string     
  customer: string       
  channel: string        
}


export interface CollectionAgeing {
  name: string
  value: number
}

export interface CollectionDebtor {
  name: string
  amount: number
  days: number
}

export interface CollectionDetailData {
  trendDate: string[]
  trendActual: number[]
  trendPlan: number[]
  ageingData: CollectionAgeing[]
  topDebtors: CollectionDebtor[]
}

// =====================
// 销售明细明细（All Details）相关类型
// =====================
export interface SalesDetailRecord {
  businessDate: string    // 日期
  companyName: string     // 公司
  region: string          // 渠道
  productName: string     // 物料
  groupName: string       // 物料组
  sales: number           // 销量
  amount: number          // 销售额
  price: number           // 单价
}

export interface SalesDetailQueryParams {
  companyName?: string
  date?: string
}