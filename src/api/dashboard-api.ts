/**
 * ============================================================
 * api/dashboard.ts — 仪表盘相关接口定义
 * ============================================================
 *
 * 每个函数对应一个后台接口，职责单一，便于维护。
 *
 * 📌 后台接口约定（示例，以实际文档为准）：
 *
 *   GET  /api/dashboard/overview          → 销售指标总览
 *   GET  /api/dashboard/price-deviations  → 价格偏差列表
 *   GET  /api/dashboard/all               → 一次返回全部数据（推荐）
 *
 * 响应格式统一为：
 *   { code: 0, message: 'ok', data: { ... } }
 * ============================================================
 */

import http from './http'
import type {
  ApiResponse,
  DashboardData,
  SalesMetric,
  CollectionMetric,
  OrderMetric,
  PriceDeviationItem,
} from '@/types'

// ─── 后台原始数据结构（可能与前端 DTO 不同，需要适配） ──────────
// 如果后台字段与前端 interface 完全一致，可直接删除这部分，
// 把下方适配函数里的 from* 改为直接返回 data 即可。

/** 后台返回的销售指标原始格式 */
interface RawSalesMetric {
  metricName: string       // → label
  displayValue: string     // → value
  budgetRate: number       // → budgetRatio（0~1 小数）
  gapValue: number         // → targetGap
  monthGoal: number        // → monthTarget
}

/** 后台返回的回款原始格式 */
interface RawCollection {
  collectionAmount: string
  collectionRate: number
  gapValue: number
  monthGoal: number
}

/** 后台返回的订单原始格式 */
interface RawOrder {
  orderTitle: string
  orderCount: number
  orderRate: number
  barColor: string
}

/** 后台返回的价格偏差原始格式 */
interface RawPriceDeviation {
  productName: string
  avgPrice7d: number
  todayPrice: number
  deviationAmt: number
  deviationPct: number     // 百分比数值，如 -11.11
}

// ─── 数据适配函数（后台字段 → 前端 DTO）────────────────────────
// 如果后台字段已与前端一致，直接删掉这些函数，接口中 return data 即可。

function fromRawSalesMetric(raw: RawSalesMetric): SalesMetric {
  const pct = (raw.budgetRate * 100).toFixed(2) + '%'
  return {
    label:           raw.metricName,
    value:           raw.displayValue,
    budgetRatio:     raw.budgetRate,
    budgetRatioText: pct,
    targetGap:       raw.gapValue,
    monthTarget:     raw.monthGoal,
    gapColor:        raw.gapValue < 0 ? 'red' : 'green',
  }
}

function fromRawCollection(raw: RawCollection): CollectionMetric {
  const pct = (raw.collectionRate * 100).toFixed(2) + '%'
  return {
    amount:      raw.collectionAmount,
    rate:        raw.collectionRate,
    rateText:    pct,
    targetGap:   raw.gapValue,
    monthTarget: raw.monthGoal,
  }
}

function fromRawOrder(raw: RawOrder): OrderMetric {
  const pct = (raw.orderRate * 100).toFixed(2) + '%'
  return {
    title:     raw.orderTitle,
    count:     raw.orderCount,
    ratio:     raw.orderRate,
    ratioText: pct,
    color:     raw.barColor,
  }
}

function fromRawPriceDeviation(raw: RawPriceDeviation): PriceDeviationItem {
  const rate    = raw.deviationPct / 100
  const rateStr = raw.deviationPct.toFixed(2) + '%'
  return {
    product:          raw.productName,
    sevenDayAvgPrice: raw.avgPrice7d,
    todayAvgPrice:    raw.todayPrice,
    deviationAmount:  raw.deviationAmt,
    deviationRate:    rate,
    deviationRateText: rateStr,
    isAlert:          rate <= -0.05,
  }
}

// ─── API 接口函数 ───────────────────────────────────────────────

/**
 * 获取仪表盘全量数据（推荐：一次请求拿到所有数据）
 *
 * 对应后台接口：GET /api/dashboard/all
 */
export async function getDashboardAll(): Promise<DashboardData> {
  const res = await http.get<any, ApiResponse<{
    salesVolume:     RawSalesMetric
    salesAmount:     RawSalesMetric
    collection:      RawCollection
    monthOrders:     RawOrder
    yearOrders:      RawOrder
    priceDeviations: RawPriceDeviation[]
  }>>('/dashboard/all')

  const d = res.data
  return {
    salesVolume:     fromRawSalesMetric(d.salesVolume),
    salesAmount:     fromRawSalesMetric(d.salesAmount),
    collection:      fromRawCollection(d.collection),
    monthOrders:     fromRawOrder(d.monthOrders),
    yearOrders:      fromRawOrder(d.yearOrders),
    priceDeviations: d.priceDeviations.map(fromRawPriceDeviation),
  }
}

/**
 * 单独获取销售指标（如需局部刷新时使用）
 *
 * 对应后台接口：GET /api/dashboard/overview
 */
export async function getDashboardOverview() {
  const res = await http.get<any, ApiResponse<{
    salesVolume: RawSalesMetric
    salesAmount: RawSalesMetric
    collection:  RawCollection
    monthOrders: RawOrder
    yearOrders:  RawOrder
  }>>('/dashboard/overview')

  const d = res.data
  return {
    salesVolume: fromRawSalesMetric(d.salesVolume),
    salesAmount: fromRawSalesMetric(d.salesAmount),
    collection:  fromRawCollection(d.collection),
    monthOrders: fromRawOrder(d.monthOrders),
    yearOrders:  fromRawOrder(d.yearOrders),
  }
}

/**
 * 单独获取价格偏差列表（如需局部刷新时使用）
 *
 * 对应后台接口：GET /api/dashboard/price-deviations
 * 可传查询参数，如日期范围：?startDate=2024-01-01&endDate=2024-01-31
 */
export async function getPriceDeviations(params?: {
  startDate?: string
  endDate?: string
}): Promise<PriceDeviationItem[]> {
  const res = await http.get<any, ApiResponse<RawPriceDeviation[]>>(
    '/dashboard/price-deviations',
    { params },
  )
  return res.data.map(fromRawPriceDeviation)
}
