import http from './http'
import type {
  ApiResponse,
  ProductionDetailPage,
  ProductionEnergyDetail,
  ProductionHighRiskWorkDetail,
  ProductionOutputDetail,
  ProductionOverview,
  ProductionRankItem,
  ProductionRawConsumptionDetail,
  ProductionStartupShutdownDetail,
  ProductionToxicGasDetail,
  ProductionTransportDetail,
  ProductionWasteDetail,
  ProductionWaterGasDetail,
  ProductionWorkbench,
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

export async function getProductionWorkbench(params: {
  type: string
  date: string
  scope?: string
}): Promise<ProductionWorkbench | null> {
  const res = await http.get<any, ApiResponse<ProductionWorkbench>>('/production/workbench', { params })
  return res.data || null
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

export async function getProductionEnergyDetails(params: {
  date: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ProductionDetailPage<ProductionEnergyDetail>> {
  const res = await http.get<any, ApiResponse<ProductionDetailPage<ProductionEnergyDetail>>>('/production/energy/details', { params })
  return res.data || { list: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
}

export async function getProductionStartupShutdownDetails(params: {
  date: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ProductionDetailPage<ProductionStartupShutdownDetail>> {
  const res = await http.get<any, ApiResponse<ProductionDetailPage<ProductionStartupShutdownDetail>>>('/production/startup-shutdown/details', { params })
  return res.data || { list: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
}

export async function getProductionHighRiskWorkDetails(params: {
  date: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ProductionDetailPage<ProductionHighRiskWorkDetail>> {
  const res = await http.get<any, ApiResponse<ProductionDetailPage<ProductionHighRiskWorkDetail>>>('/production/safety/high-risk/details', { params })
  return res.data || { list: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
}

export async function getProductionToxicGasDetails(params: {
  date: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ProductionDetailPage<ProductionToxicGasDetail>> {
  const res = await http.get<any, ApiResponse<ProductionDetailPage<ProductionToxicGasDetail>>>('/production/safety/toxic-gas/details', { params })
  return res.data || { list: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
}

export async function getProductionWasteDetails(params: {
  date: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ProductionDetailPage<ProductionWasteDetail>> {
  const res = await http.get<any, ApiResponse<ProductionDetailPage<ProductionWasteDetail>>>('/production/waste/details', { params })
  return res.data || { list: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
}

export async function getProductionWaterGasDetails(params: {
  date: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ProductionDetailPage<ProductionWaterGasDetail>> {
  const res = await http.get<any, ApiResponse<ProductionDetailPage<ProductionWaterGasDetail>>>('/production/environment/water-gas/details', { params })
  return res.data || { list: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
}
