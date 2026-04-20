import type {
  SalesMetric,
  CollectionMetric,
  OrderMetric,
  PriceDeviationItem,
  SalesTrendProduct,
} from '@/types'

// ==============================
// 模拟数据 — 可替换为后台接口调用
// ==============================

/** 总销量 */
export const mockSalesVolume: SalesMetric = {
  label: '总销量',
  value: '16,341.00 吨',
  budgetRatio: 0.4459,
  budgetRatioText: '44.59%',
  targetGap: -20305,
  monthTarget: 36646,
  gapColor: 'red',
}

/** 总销售额 */
export const mockSalesAmount: SalesMetric = {
  label: '总销售额',
  value: '31,634.00 万元',
  budgetRatio: 0.3388,
  budgetRatioText: '33.88%',
  targetGap: -61719,
  monthTarget: 93353,
  gapColor: 'red',
}

/** 回款金额 */
export const mockCollection: CollectionMetric = {
  amount: '28,768.00 万元',
  rate: 0.91,
  rateText: '91.00%',
  targetGap: -2866,
  monthTarget: 31634,
}

/** 本月未关订单数 */
export const mockMonthOrders: OrderMetric = {
  title: '本月未关订单数',
  count: 1,
  ratio: 0.1,
  ratioText: '10.00%',
  color: '#f59e0b',
}

/** 本年未关订单数 */
export const mockYearOrders: OrderMetric = {
  title: '本年未关订单数',
  count: 6,
  ratio: 0.14,
  ratioText: '14.00%',
  color: '#a855f7',
}

/** 价格偏差列表 */
export const mockPriceDeviations: PriceDeviationItem[] = [
  {
    product: 'R32',
    sevenDayAvgPrice: 62524,
    todayAvgPrice: 62000,
    deviationAmount: -524,
    deviationRate: -0.0084,
    deviationRateText: '-0.84%',
    isAlert: false,
  },
  {
    product: 'PTFE悬浮中粒',
    sevenDayAvgPrice: 39893,
    todayAvgPrice: 39394,
    deviationAmount: -499,
    deviationRate: -0.0125,
    deviationRateText: '-1.25%',
    isAlert: false,
  },
  {
    product: 'PTFE分散树脂',
    sevenDayAvgPrice: 44221,
    todayAvgPrice: 39307,
    deviationAmount: -4914,
    deviationRate: -0.1111,
    deviationRateText: '-11.11%',
    isAlert: true,
  },
  {
    product: '六氟丙烯',
    sevenDayAvgPrice: 39959,
    todayAvgPrice: 37304,
    deviationAmount: -2655,
    deviationRate: -0.0664,
    deviationRateText: '-6.64%',
    isAlert: true,
  },
  {
    product: 'R152a',
    sevenDayAvgPrice: 61254,
    todayAvgPrice: 60779,
    deviationAmount: -475,
    deviationRate: -0.0078,
    deviationRateText: '-0.78%',
    isAlert: false,
  },
  {
    product: 'R134a',
    sevenDayAvgPrice: 57766,
    todayAvgPrice: 51936,
    deviationAmount: -5830,
    deviationRate: -0.1009,
    deviationRateText: '-10.09%',
    isAlert: true,
  },
]

/** 获取所有仪表盘数据（模拟异步接口） */
export async function fetchDashboardData() {
  // 模拟网络延迟 300ms
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    salesVolume: mockSalesVolume,
    salesAmount: mockSalesAmount,
    collection: mockCollection,
    monthOrders: mockMonthOrders,
    yearOrders: mockYearOrders,
    priceDeviations: mockPriceDeviations,
  }
}

// ==============================
// 销售趋势 Mock 数据
// ==============================

function makeTrend(
  product: string,
  volumes: number[],
  prices: number[],
): SalesTrendProduct {
  const dates = ['02-07','02-08','02-09','02-10','02-11','02-12','02-13']
  const trend = dates.map((date, i) => ({
    date, volume: volumes[i], price: prices[i],
  }))

  // 简单皮尔逊相关系数
  const n = volumes.length
  const avgV = volumes.reduce((a, b) => a + b, 0) / n
  const avgP = prices.reduce((a, b) => a + b, 0) / n
  const num = volumes.reduce((s, v, i) => s + (v - avgV) * (prices[i] - avgP), 0)
  const den = Math.sqrt(
    volumes.reduce((s, v) => s + (v - avgV) ** 2, 0) *
    prices.reduce((s, p) => s + (p - avgP) ** 2, 0),
  )
  const correlation = den === 0 ? 0 : parseFloat((num / den).toFixed(2))

  const vChange = parseFloat(((volumes[6] - volumes[0]) / volumes[0]).toFixed(4))
  const pChange = parseFloat(((prices[6] - prices[0]) / prices[0]).toFixed(4))

  return {
    product,
    latestDate: '02-13',
    latestVolume: volumes[6],
    latestPrice: prices[6],
    volumeChange: vChange,
    priceChange: pChange,
    correlation,
    trend,
  }
}

export const mockSalesTrends: SalesTrendProduct[] = [
  makeTrend('R32',
    [114, 52, 183, 160, 72, 116, 95],
    [58200, 57800, 59000, 58500, 56800, 57200, 62000],
  ),
  makeTrend('R134a',
    [28, 35, 42, 30, 25, 20, 23],
    [53500, 53000, 54200, 53800, 52600, 52000, 51936],
  ),
  makeTrend('R152a',
    [60, 55, 68, 72, 58, 50, 54],
    [59800, 59400, 60500, 61000, 60200, 59800, 60779],
  ),
  makeTrend('六氟丙烯',
    [18, 22, 25, 20, 24, 19, 21],
    [38200, 37800, 39000, 38500, 37600, 37200, 37304],
  ),
  makeTrend('PTFE分散树脂',
    [10, 8, 12, 9, 6, 5, 7],
    [44500, 43800, 45000, 42000, 40500, 39800, 39307],
  ),
  makeTrend('PTFE悬浮中粒',
    [15, 12, 18, 14, 11, 13, 12],
    [40200, 39800, 40800, 40200, 39600, 39200, 39394],
  ),
]

export async function fetchSalesTrends(): Promise<SalesTrendProduct[]> {
  await new Promise(r => setTimeout(r, 200))
  return mockSalesTrends
}
