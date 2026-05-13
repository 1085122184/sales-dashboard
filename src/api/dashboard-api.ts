import http from './http'
import type { ApiResponse, PriceDeviationDetail, CompanySummaryMetric, CompanyDetailData ,ProductDeepDetail,OrderRecord,CollectionDetailData, SalesDetailRecord, SalesDetailQueryParams} from '@/types'
import { 
  adaptSalesMetric, 
  adaptCollection, 
  adaptOrder, 
  adaptPriceDeviation, 
  adaptSalesTrend 
} from './adapter/dashboardAdapter'

/** 1. 获取核心指标 */
export async function getDashboardMetrics(date?: string) {
  const res = await http.get<any, ApiResponse<any>>('/metrics', { params: { date } })
  const data = res.data || {}
  
  // 使用 Adapter 统一处理映射，告别内联硬编码
  return {
    salesVolume: adaptSalesMetric(data.salesVolume),
    salesAmount: adaptSalesMetric(data.salesAmount),
    collection: adaptCollection(data.collection)
  }
}

/** 2. 获取订单指标 */
export async function getDashboardOrders(date?: string) {
  const res = await http.get<any, ApiResponse<any>>('/metrics/orders', { params: { date } })
  const data = res.data || {}

  return {
    monthOrders: adaptOrder(data.monthOrders),
    yearOrders: adaptOrder(data.yearOrders)
  }
}

/** 3. 获取价格偏差台账 */
export async function getPriceDeviations(params?: { date?: string, [key: string]: any }) {
  const res = await http.get<any, ApiResponse<any[]>>('/price-analysis/deviations', { params })
  return (res.data || []).map(adaptPriceDeviation)
}

/** 4. 下钻：获取防破价雷达明细 */
export async function getPriceDeviationDetails(code: string, region: string, date?: string, type: 'today' | '7days' = 'today'): Promise<PriceDeviationDetail[]> {
  const res = await http.get<any, ApiResponse<PriceDeviationDetail[]>>('/price-analysis/deviations/details', { 
    // 🌟 将 type 传入 params
    params: { code, region, date, type } 
  })
  return res.data || []
}

/** 5. 获取量价趋势 */
export async function getSalesTrends(date?: string) {
  const res = await http.get<any, ApiResponse<any[]>>('/trend-analysis/monthly', { params: { date } })
  return (res.data || []).map(adaptSalesTrend)
}


export async function getSalesTrendYearDetail(productCode: string, region: string, date?: string) {
  const res = await http.get<any, ApiResponse<any[]>>('/trend-analysis/yearly', { 
    params: { productCode, region, date } 
  })
  return res.data || []
}

/** 6. 获取左侧公司概要列表 */
export async function getSalesCompanies(type: string, date: string): Promise<CompanySummaryMetric[]> {
  const res = await http.get<any, ApiResponse<CompanySummaryMetric[]>>('/sales-analysis/companies', {
    params: { type, date }
  })
  return res.data || []
}

/** 7. 获取单个公司图表深度明细 */
export async function getSalesCompanyDetail(companyName: string, type: string, date: string, target: number): Promise<CompanyDetailData> {
  const res = await http.get<any, ApiResponse<CompanyDetailData[]>>('/sales-analysis/companies/detail', {
    params: { companyName, type, date, target }
  })
  
  const detailData = res.data && res.data.length > 0 ? res.data[0] : null
  return detailData || { products: [], dailySales: [] }
}


/** 获取订单下钻 - 公司穿透明细 */
export async function getOrderCompanyDetail(companyName: string, date: string): Promise<OrderRecord[]> {
  const res = await http.get<any, ApiResponse<OrderRecord[]>>('/sales-analysis/orders/company-detail', {
    params: { companyName, date }
  })
  return res.data || []
}

/** 抽屉下钻：获取单个产品的多维分析数据 (支持 month / year) */
export async function getProductDeepDetail(companyName: string, productCode: string, type: 'month' | 'year', date?: string): Promise<ProductDeepDetail | null> {
  const res = await http.get<any, ApiResponse<ProductDeepDetail>>('/sales-analysis/product-deep', {
    params: { companyName, productCode, type, date }
  })
  return res.data || null
}


export async function getCompanyAiDiagnosis(params: {
  companyName: string
  value: number
  target: number
  unit: string
  date: string
  bizType: 'sales' | 'collection'
}) {
  const res = await http.get<any, ApiResponse<any>>('/dashboard/ai/company-diagnosis', { params })
  return res.data || null
}

/** * 获取回款下钻 - 左侧公司列表 
 */
export async function getCollectionCompanies(date: string): Promise<CompanySummaryMetric[]> {
  const res = await http.get<any, ApiResponse<CompanySummaryMetric[]>>('/collection-analysis/companies', {
    params: { date }
  })
  return res.data || []
}

/** * 获取回款下钻 - 右侧单个公司图表深度明细
 */
export async function getCollectionCompanyDetail(companyName: string, date: string): Promise<CollectionDetailData | null> {
  const res = await http.get<any, ApiResponse<CollectionDetailData>>('/collection-analysis/company-detail', {
    params: { companyName, date }
  })
  return res.data || null
}

/** 获取销售明细列表 */
export async function getSalesDetails(params?: SalesDetailQueryParams): Promise<SalesDetailRecord[]> {
  const res = await http.get<any, ApiResponse<SalesDetailRecord[]>>('/all_details/sale_details', {
    params
  })
  return res.data || []
}