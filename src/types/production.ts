export interface ProductionMetric {
  label: string
  value: number | null
  unit: string
  description?: string
}

export interface ProductionThroughput {
  inbound: number
  outbound: number
  vehicleCount: number
  unit: string
}

export interface ProductionEnergyOverview {
  water?: ProductionMetric | null
  electricity?: ProductionMetric | null
  refrigeration?: ProductionMetric | null
  steam?: ProductionMetric | null
  naturalGas?: ProductionMetric | null
  hydrogen?: ProductionMetric | null
  pureWater?: ProductionMetric | null
}

export interface ProductionStartupShutdownOverview {
  startupCount?: number | null
  shutdownCount?: number | null
  totalCount?: number | null
  unit?: string
}

export interface ProductionSafetyOverview {
  processAlarm?: ProductionMetric | null
  equipmentAlarm?: ProductionMetric | null
  highRiskWork?: ProductionMetric | null
  toxicGasAlarm?: ProductionMetric | null
  riskCount?: ProductionMetric | null
  dealCount?: ProductionMetric | null
  rectificationRate?: number | null
}

export interface ProductionEnvironmentOverview {
  exhaustEmissionPoints?: ProductionMetric | null
  wastewaterEmissionPoints?: ProductionMetric | null
  totalWaterGasPoints?: ProductionMetric | null
  hazardousWaste?: ProductionMetric | null
}

export interface ProductionOverview {
  date: string
  totalOutput: ProductionMetric
  rawMaterialConsumption: ProductionMetric
  productInventory: ProductionMetric
  outputMaterialGroups: ProductionMetric
  rawMaterialKinds: ProductionMetric
  throughput: ProductionThroughput
  energy?: ProductionEnergyOverview | null
  startupShutdown?: ProductionStartupShutdownOverview | null
  safety?: ProductionSafetyOverview | null
  environment?: ProductionEnvironmentOverview | null
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

export interface ProductionTimeline {
  dayOfMonth?: number
  daysInMonth?: number
  remainingDays?: number
  progress?: number
}

export interface ProductionTrendPoint {
  date?: string
  label?: string
  series?: string
  value?: number
}

export interface ProductionRankingItem {
  code?: string
  name?: string
  category?: string
  unit?: string
  value?: number
  secondaryValue?: number
  thirdValue?: number
}

export interface ProductionWorkbenchCard {
  id?: string
  name?: string
  subtitle?: string
  unit?: string
  value?: number
  secondaryValue?: number
  thirdValue?: number
  rate?: number
  metrics?: ProductionMetric[]
}

export interface ProductionWorkbench {
  type: ProductionDetailType
  date: string
  title: string
  scope?: string
  emptyReason?: string
  timeline?: ProductionTimeline
  summary?: ProductionMetric[]
  cards?: ProductionWorkbenchCard[]
  dailyTrends?: ProductionTrendPoint[]
  rankings?: ProductionRankingItem[]
}

export interface ProductionDetailPage<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export type ProductionDetailType =
  | 'output'
  | 'raw'
  | 'transport'
  | 'energy'
  | 'startupShutdown'
  | 'highRisk'
  | 'toxicGas'
  | 'waste'
  | 'waterGas'

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

export interface ProductionEnergyDetail {
  postingDate?: string
  medium?: string
  point?: string
  pointStatus?: string
  cumulativeValue?: number
  area?: string
  company?: string
  companyCode?: string
}

export interface ProductionStartupShutdownDetail {
  sourceRn?: string
  company?: string
  device?: string
  time?: string
  dev?: string
  standard?: string
  sort?: string
  value?: string
}

export interface ProductionHighRiskWorkDetail {
  workDate?: string
  companyName?: string
  workCount?: number
}

export interface ProductionToxicGasDetail {
  alarmDate?: string
  company?: string
  alarmCount?: number
}

export interface ProductionWasteDetail {
  postingDate?: string
  companyCode?: string
  companyName?: string
  company?: string
  wasteCode?: string
  wasteName?: string
  output?: number
}

export interface ProductionWaterGasDetail {
  pointCode?: string
  pointName?: string
  subName?: string
  itemDesc?: string
  generateTime?: string
  groupTime?: string
}
