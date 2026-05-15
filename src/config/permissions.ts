export const DECISION_PERMISSIONS = {
  METRICS_VIEW: 'decision:metrics:view',
  PRICE_ANALYSIS_VIEW: 'decision:price-analysis:view',
  SALES_ANALYSIS_VIEW: 'decision:sales-analysis:view',
  TREND_ANALYSIS_VIEW: 'decision:trend-analysis:view',
  COLLECTION_ANALYSIS_VIEW: 'decision:collection-analysis:view',
  EXPENSE_VIEW: 'decision:expense:view',
  ALL_DETAILS_VIEW: 'decision:all-details:view',
  PRODUCTION_VIEW: 'decision:production:view',
  PRODUCTION_DETAIL_VIEW: 'decision:production-detail:view',
  AI_INSIGHT: 'decision:ai:insight',
  AI_DIAGNOSIS: 'decision:ai:diagnosis'
} as const

export const SYSTEM_ROLE_PERMISSIONS = {
  LIST: 'system:role:list',
  ADD: 'system:role:add',
  EDIT: 'system:role:edit',
  REMOVE: 'system:role:remove',
  GRANT: 'system:role:grant'
} as const

export const PERMISSION_LABELS: Record<string, string> = {
  [DECISION_PERMISSIONS.METRICS_VIEW]: '销售指标大盘',
  [DECISION_PERMISSIONS.PRICE_ANALYSIS_VIEW]: '价格分析',
  [DECISION_PERMISSIONS.SALES_ANALYSIS_VIEW]: '销售分析',
  [DECISION_PERMISSIONS.TREND_ANALYSIS_VIEW]: '趋势分析',
  [DECISION_PERMISSIONS.COLLECTION_ANALYSIS_VIEW]: '回款分析',
  [DECISION_PERMISSIONS.EXPENSE_VIEW]: '三费监控',
  [DECISION_PERMISSIONS.ALL_DETAILS_VIEW]: '明细数据查询',
  [DECISION_PERMISSIONS.PRODUCTION_VIEW]: '生产运营指标大盘',
  [DECISION_PERMISSIONS.PRODUCTION_DETAIL_VIEW]: '生产明细数据',
  [DECISION_PERMISSIONS.AI_INSIGHT]: 'AI 价格洞察',
  [DECISION_PERMISSIONS.AI_DIAGNOSIS]: 'AI 公司诊断',
  [SYSTEM_ROLE_PERMISSIONS.LIST]: '角色/账号查询',
  [SYSTEM_ROLE_PERMISSIONS.ADD]: '角色/账号新增',
  [SYSTEM_ROLE_PERMISSIONS.EDIT]: '角色/账号编辑',
  [SYSTEM_ROLE_PERMISSIONS.REMOVE]: '角色/账号删除',
  [SYSTEM_ROLE_PERMISSIONS.GRANT]: '角色授权'
}

export const DASHBOARD_REQUIRED_PERMISSIONS = [
  DECISION_PERMISSIONS.METRICS_VIEW,
  DECISION_PERMISSIONS.PRICE_ANALYSIS_VIEW,
  DECISION_PERMISSIONS.TREND_ANALYSIS_VIEW
] as const
