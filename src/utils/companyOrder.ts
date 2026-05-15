export interface CompanyOrderItem {
  name: string
  queryName: string
  code?: string
  aliases: string[]
}

export const COMPANY_ORDER: CompanyOrderItem[] = [
  { name: '绿冷公司', queryName: '绿冷', code: '3000', aliases: ['绿冷公司', '绿冷', '3000'] },
  { name: '高分子公司', queryName: '高分子', code: '1200', aliases: ['高分子公司', '高分子', '1200'] },
  { name: '氟硅公司', queryName: '氟硅', code: '1300', aliases: ['氟硅公司', '氟硅', '1300'] },
  { name: '有机硅公司', queryName: '有机硅', code: '1400', aliases: ['有机硅公司', '有机硅', '1400'] },
  { name: '内蒙金鹏', queryName: '内蒙金峰',code: '2200', aliases: ['内蒙金峰', '内蒙古金峰', '金峰','2200'] },
  { name: '内蒙明岳', queryName: '内蒙明岳',code: '2500', aliases: ['内蒙明岳', '内蒙古明岳', '明岳','2500'] },
  { name: '联邦置业', queryName: '联邦置业', aliases: ['联邦置业'] },
  { name: '东岳置业', queryName: '东岳置业', aliases: ['东岳置业'] },
  { name: '科技集团', queryName: '科技集团',code: '2000', aliases: ['科技集团', '东岳集团', '东岳科技集团','2000'] },
  { name: '东营盐业', queryName: '东营盐业',code: '2100', aliases: ['东营盐业', '盐业','2100'] },
  { name: '鑫河硅基', queryName: '鑫河硅基', aliases: ['鑫河硅基', '鑫河'] },
  { name: '西南阳光', queryName: '西南阳光',code: '2900', aliases: ['西南阳光','2900'] },
  { name: '湖北君雅', queryName: '湖北君健',code: '2800', aliases: ['湖北君健', '君健','2800'] },
  { name: '国贸公司', queryName: '国贸公司', aliases: ['国贸公司', '国贸'] }
]

export const COMPANY_SELECT_OPTIONS = [
  { label: '全部公司', value: '' },
  ...COMPANY_ORDER.map(item => ({ label: item.name, value: item.queryName }))
]

function normalizeCompanyName(name: string | null | undefined) {
  return String(name || '')
    .replace(/\s+/g, '')
    .replace(/[（）()]/g, '')
    .trim()
}

function normalizeCompanyCode(code: string | number | null | undefined) {
  const raw = String(code ?? '').trim()
  if (!raw) return ''
  return raw.replace(/\.0$/, '')
}

export function getCompanyOrderIndex(
  name: string | null | undefined,
  code?: string | number | null | undefined
) {
  const normalizedCode = normalizeCompanyCode(code)
  if (normalizedCode) {
    const codeIndex = COMPANY_ORDER.findIndex(item => item.code === normalizedCode)
    if (codeIndex !== -1) return codeIndex
  }

  const normalized = normalizeCompanyName(name)
  if (!normalized) return Number.MAX_SAFE_INTEGER

  const index = COMPANY_ORDER.findIndex(item =>
    item.aliases.some(alias => {
      const normalizedAlias = normalizeCompanyName(alias)
      return normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)
    })
  )

  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

export function sortByCompanyOrder<T>(
  list: readonly T[] | null | undefined,
  getName: (item: T) => string | null | undefined,
  getCode?: (item: T) => string | number | null | undefined
) {
  return [...(list || [])]
    .map((item, index) => ({ item, index, order: getCompanyOrderIndex(getName(item), getCode?.(item)) }))
    .sort((a, b) => (a.order - b.order) || (a.index - b.index))
    .map(({ item }) => item)
}

export function getCompanyCodeFromRecord(item: unknown): string | number | null | undefined {
  const record = item as Record<string, unknown>
  const value = record?.companyCode
    ?? record?.company_code
    ?? record?.companyId
    ?? record?.company_id
    ?? record?.code
    ?? record?.公司编码

  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}
