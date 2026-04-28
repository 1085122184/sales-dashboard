// src/types/dashboard.d.ts

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

export interface CollectionDetailData {
  customer: string
  volume: number
  amount: number
}

export interface OrderMetric {
  title: string
  count: number
  ratio: number
  ratioText: string
  color: string
}

export interface PriceDeviationItem {
  productCode: string     
  product: string         
  region: string          
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

export interface DashboardData {
  salesVolume: SalesMetric
  salesAmount: SalesMetric
  collection: CollectionMetric
  monthOrders: OrderMetric
  yearOrders: OrderMetric
  priceDeviations: PriceDeviationItem[]
}

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

export interface ProductDeepKPI {
  totalVolume: number       
  avgPrice: number          
  profitEst: string         
}

export interface ProductDeepTrend {
  date: string              
  domesticVolume: number    
  intlVolume: number        
  amount: number            
}

export interface ProductDeepCustomer {
  name: string              
  volume: number            
}

export interface ProductDeepDetail {
  kpi: ProductDeepKPI
  trend: ProductDeepTrend[]
  topCustomers: ProductDeepCustomer[]
}

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
  orderNum:number
  orderAmount:number
  details?: OrderDetailItem[]
}

export interface OrderDetailItem {
  materialDesc: string
  customer: string
  office: string
  volume: number
  price: number
  amount: number
  detailDate: string
}

// 🌟 新增：公司维度的增长点（绝对值与增长率）
export interface CompanyGrowthPoint {
  companyName: string;
  currentValue: number;    // 本期值(万)
  yoyValue: number;        // 去年同期值(万)
  momValue: number;        // 上期环比值(万)
  yoy: number;             // 同比增长率 %
  mom: number;             // 环比增长率 %
}