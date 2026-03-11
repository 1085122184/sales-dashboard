// src/api/dashboard-api.ts
import http from './http'
import type {
  ApiResponse,
  SalesMetric,
  CollectionMetric,
  OrderMetric,
  PriceDeviationItem,
  PriceDeviationDetail,
  SalesTrendProduct
} from '@/types'

// ─── 后台原始数据结构（DTO） ──────────
interface RawSalesMetric {
  metricName: string
  displayValue: string
  budgetRate: number
  gapValue: number
  monthGoal: number
}

interface RawCollection {
  collectionAmount: string
  collectionRate: number
  gapValue: number
  monthGoal: number
}

interface RawOrder {
  orderTitle: string
  orderCount: number
  orderRate: number
  barColor: string
}

interface RawPriceDeviation {
  productCode: string
  productName: string
  region: string
  avgPrice7d: number
  todayPrice: number
  deviationAmt: number
  deviationPct: number
}

// ─── 数据适配函数 ────────────────────────
function fromRawSalesMetric(raw: RawSalesMetric): SalesMetric {
  return {
    label: raw.metricName,
    value: raw.displayValue,
    budgetRatio: raw.budgetRate,
    budgetRatioText: (raw.budgetRate * 100).toFixed(2) + '%',
    targetGap: raw.gapValue,
    monthTarget: raw.monthGoal,
    gapColor: raw.gapValue < 0 ? 'red' : 'green',
  }
}

function fromRawCollection(raw: RawCollection): CollectionMetric {
  return {
    amount: raw.collectionAmount,
    rate: raw.collectionRate,
    rateText: (raw.collectionRate * 100).toFixed(2) + '%',
    targetGap: raw.gapValue,
    monthTarget: raw.monthGoal,
  }
}

function fromRawOrder(raw: RawOrder): OrderMetric {
  return {
    title: raw.orderTitle,
    count: raw.orderCount,
    ratio: raw.orderRate,
    ratioText: (raw.orderRate * 100).toFixed(2) + '%',
    color: raw.barColor,
  }
}

function fromRawPriceDeviation(raw: RawPriceDeviation): PriceDeviationItem {
  const rate = raw.deviationPct / 100
  return {
    productCode: raw.productCode,
    product: raw.productName,
    region: raw.region || '未知',
    sevenDayAvgPrice: raw.avgPrice7d,
    todayAvgPrice: raw.todayPrice,
    deviationAmount: raw.deviationAmt,
    deviationRate: rate,
    deviationRateText: raw.deviationPct.toFixed(2) + '%',
    isAlert: rate <= -0.05,
  }
}

// ─── API 接口函数 (按需拆分) ───────────────────────────────────────────────

/** 1. 获取核心指标 */
export async function getDashboardMetrics(date?: string) {
  const res = await http.get<any, ApiResponse<any>>('/dashboard/metrics', { params: { date } })
  return {
    salesVolume: { label: res.data.salesVolume.metricName, value: res.data.salesVolume.displayValue, budgetRatio: res.data.salesVolume.budgetRate, budgetRatioText: (res.data.salesVolume.budgetRate * 100).toFixed(2) + '%', targetGap: res.data.salesVolume.gapValue, monthTarget: res.data.salesVolume.monthGoal, gapColor: res.data.salesVolume.gapValue < 0 ? 'red' : 'green' },
    salesAmount: { label: res.data.salesAmount.metricName, value: res.data.salesAmount.displayValue, budgetRatio: res.data.salesAmount.budgetRate, budgetRatioText: (res.data.salesAmount.budgetRate * 100).toFixed(2) + '%', targetGap: res.data.salesAmount.gapValue, monthTarget: res.data.salesAmount.monthGoal, gapColor: res.data.salesAmount.gapValue < 0 ? 'red' : 'green' },
    collection: { amount: res.data.collection.collectionAmount, rate: res.data.collection.collectionRate, rateText: (res.data.collection.collectionRate * 100).toFixed(2) + '%', targetGap: res.data.collection.gapValue, monthTarget: res.data.collection.monthGoal }
  }
}

/** 2. 获取订单指标 */
export async function getDashboardOrders(date?: string) {
  const res = await http.get<any, ApiResponse<any>>('/dashboard/orders', { params: { date } })
  return {
    monthOrders: { title: res.data.monthOrders.orderTitle, count: res.data.monthOrders.orderCount, ratio: res.data.monthOrders.orderRate, ratioText: (res.data.monthOrders.orderRate * 100).toFixed(2) + '%', color: res.data.monthOrders.barColor },
    yearOrders: { title: res.data.yearOrders.orderTitle, count: res.data.yearOrders.orderCount, ratio: res.data.yearOrders.orderRate, ratioText: (res.data.yearOrders.orderRate * 100).toFixed(2) + '%', color: res.data.yearOrders.barColor }
  }
}

/** 3. 获取价格偏差台账 */
export async function getPriceDeviations(params?: { date?: string, [key: string]: any }): Promise<PriceDeviationItem[]> {
  const res = await http.get<any, ApiResponse<any[]>>('/dashboard/price-deviations', { params })
  return res.data.map(fromRawPriceDeviation)
}

/** 4. 下钻：获取防破价雷达明细 */
export async function getPriceDeviationDetails(code: string, region: string, date?: string): Promise<PriceDeviationDetail[]> {
  const res = await http.get<any, ApiResponse<PriceDeviationDetail[]>>('/dashboard/price-deviations/details', { params: { code, region, date } })
  return res.data
}

/** 5. 获取量价趋势 */
export async function getSalesTrends(date?: string): Promise<SalesTrendProduct[]> {
  const res = await http.get<any, ApiResponse<any[]>>('/dashboard/trends', { params: { date } })
  return res.data.map(raw => ({
    productCode: raw.productCode, product: raw.productName, region: raw.region || '未知',
    latestDate: raw.latestDate, latestVolume: raw.latestVolume, latestPrice: raw.latestPrice, volumeChange: raw.volumeChange, priceChange: raw.priceChange, correlation: raw.correlation, trend: raw.trend
  }))
}