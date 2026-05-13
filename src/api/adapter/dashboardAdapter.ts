// src/api/adapter/dashboardAdapter.ts
import type {
  SalesMetric,
  CollectionMetric,
  OrderMetric,
  PriceDeviationItem,
  SalesTrendProduct
} from '@/types'

// ─── 后台原始数据结构（DTO）约定 ──────────
export interface RawSalesMetric {
  metricName: string
  displayValue: string
  budgetRate: number
  gapValue: number
  monthGoal: number
}

export interface RawCollection {
  collectionAmount: string
  collectionRate: number
  gapValue: number
  monthGoal: number
}

export interface RawOrder {
  orderTitle: string
  orderCount: number
  orderRate: number
  barColor: string
}

export interface RawPriceDeviation {
  productCode: string
  productName: string
  region: string
  avgPrice7d: number
  todayPrice: number
  deviationAmt: number
  deviationPct: number
}

export interface RawSalesTrend {
  productCode: string
  product: string
  region: string
  latestDate: string
  latestVolume: number
  latestPrice: number
  volumeChange: number
  priceChange: number
  correlation: number
  trend: any[] // 视后端返回的具体类型而定
}

// ─── 数据适配函数（Adapter） ────────────────────────

export function adaptSalesMetric(raw: RawSalesMetric): SalesMetric {
  const isVolume = raw.metricName?.includes('量') || (raw as any).type === 'volume'
  if (!raw) return {} as SalesMetric
  return {
    label: raw.metricName,
    value: raw.displayValue,
    budgetRatio: raw.budgetRate,
    budgetRatioText: (raw.budgetRate * 100).toFixed(2) + '%',
    targetGap: raw.gapValue,
    monthTarget: raw.monthGoal,
    gapColor: raw.gapValue < 0 ? 'red' : 'green',
    type: isVolume ? 'volume' : 'amount'
  }
}

export function adaptCollection(raw: RawCollection): CollectionMetric {
  if (!raw) return {} as CollectionMetric
  return {
    amount: raw.collectionAmount,
    rate: raw.collectionRate,
    rateText: (raw.collectionRate * 100).toFixed(2) + '%',
    targetGap: raw.gapValue,
    monthTarget: raw.monthGoal,
    // Note: 原有代码中 CollectionMetric 需要 label 字段，若后端未返回可在视图层补充或在此处赋予默认值
    label: '回款金额', 
  }
}

export function adaptOrder(raw: RawOrder): OrderMetric {
  if (!raw) return {} as OrderMetric
  return {
    title: raw.orderTitle,
    count: raw.orderCount,
    ratio: raw.orderRate,
    ratioText: (raw.orderRate * 100).toFixed(2) + '%',
    color: raw.barColor,
  }
}

export function adaptPriceDeviation(raw: RawPriceDeviation): PriceDeviationItem {
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

export function adaptSalesTrend(raw: RawSalesTrend): SalesTrendProduct {
  return {
    productCode: raw.productCode,
    product: raw.product,
    region: raw.region || '未知',
    latestDate: raw.latestDate,
    latestVolume: raw.latestVolume,
    latestPrice: raw.latestPrice,
    volumeChange: raw.volumeChange,
    priceChange: raw.priceChange,
    correlation: raw.correlation,
    trend: raw.trend || []
  }
}