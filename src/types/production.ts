export interface ProductionMetric {
  label: string
  value: number
  unit: string
  description?: string
}

export interface ProductionThroughput {
  inbound: number
  outbound: number
  vehicleCount: number
  unit: string
}

export interface ProductionOverview {
  date: string
  totalOutput: ProductionMetric
  rawMaterialConsumption: ProductionMetric
  productInventory: ProductionMetric
  outputMaterialGroups: ProductionMetric
  rawMaterialKinds: ProductionMetric
  throughput: ProductionThroughput
  latestInventoryTime: string
}

export interface ProductionRankItem {
  code?: string
  name?: string
  factory?: string
  company?: string
  category?: string
  unit?: string
  value?: number
  inbound?: number
  outbound?: number
  vehicleCount?: number
  factoryCount?: number
  updateTime?: string
}

export interface ProductionDetailPage<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export type ProductionDetailType = 'output' | 'raw' | 'transport'

export interface ProductionOutputDetail {
  company?: string
  materialCode?: string
  materialName?: string
  materialGroup?: string
  materialGroupName?: string
  month?: string
  postingDate?: string
  workCenter?: string
  output?: number
}

export interface ProductionRawConsumptionDetail {
  inputDate?: string
  postingDate?: string
  factory?: string
  factoryName?: string
  materialCode?: string
  materialName?: string
  materialGroup?: string
  materialGroupName?: string
  storageLocation?: string
  unit?: string
  workCenter?: string
  workCenterName?: string
  orderNo?: string
  batchNo?: string
  quantity?: number
  productionPlan?: string
  materialDocument?: string
  movementType?: string
  movementTypeName?: string
  month?: string
}

export interface ProductionTransportDetail {
  orderNo?: string
  businessNo?: string
  processType?: string
  plateNo?: string
  driver?: string
  driverPhone?: string
  grossWeight?: number
  tareWeight?: number
  netWeight?: number
  materialName?: string
  weighingDate?: string
  customerName?: string
  carrier?: string
  companyName?: string
  category?: string
}
