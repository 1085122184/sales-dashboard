import http from './http'
import type {
  ApiResponse,
  ProductionDetailPage,
  ProductionOutputDetail,
  ProductionOverview,
  ProductionRankItem,
  ProductionRawConsumptionDetail,
  ProductionTransportDetail,
} from '@/types'

export async function getProductionOverview(date: string): Promise<ProductionOverview | null> {
  const res = await http.get<any, ApiResponse<ProductionOverview>>('/production/overview', { params: { date } })
  return res.data || null
}

export async function getProductionOutputByMaterialGroup(date: string): Promise<ProductionRankItem[]> {
  const res = await http.get<any, ApiResponse<ProductionRankItem[]>>('/production/output/by-material-group', { params: { date } })
  return res.data || []
}

export async function getProductionRawConsumptionByMaterial(date: string): Promise<ProductionRankItem[]> {
  const res = await http.get<any, ApiResponse<ProductionRankItem[]>>('/production/raw-consumption/by-material', { params: { date } })
  return res.data || []
}

export async function getProductionProductInventory(date: string): Promise<ProductionRankItem[]> {
  const res = await http.get<any, ApiResponse<ProductionRankItem[]>>('/production/product-inventory', { params: { date } })
  return res.data || []
}

export async function getProductionThroughputByFactory(date: string): Promise<ProductionRankItem[]> {
  const res = await http.get<any, ApiResponse<ProductionRankItem[]>>('/production/throughput/by-factory', { params: { date } })
  return res.data || []
}

export async function getProductionOutputDetails(params: {
  date: string
  company?: string
  materialGroup?: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ProductionDetailPage<ProductionOutputDetail>> {
  const res = await http.get<any, ApiResponse<ProductionDetailPage<ProductionOutputDetail>>>('/production/output/details', { params })
  return res.data || { list: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
}

export async function getProductionRawConsumptionDetails(params: {
  date: string
  factory?: string
  material?: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ProductionDetailPage<ProductionRawConsumptionDetail>> {
  const res = await http.get<any, ApiResponse<ProductionDetailPage<ProductionRawConsumptionDetail>>>('/production/raw-consumption/details', { params })
  return res.data || { list: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
}

export async function getProductionTransportDetails(params: {
  date: string
  category?: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ProductionDetailPage<ProductionTransportDetail>> {
  const res = await http.get<any, ApiResponse<ProductionDetailPage<ProductionTransportDetail>>>('/production/transport/details', { params })
  return res.data || { list: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
}
