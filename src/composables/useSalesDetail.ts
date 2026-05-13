import { ref } from 'vue'
import { getSalesCompanies, getSalesCompanyDetail } from '@/api/dashboard-api'
import type { CompanySummaryMetric, CompanyDetailData } from '@/types/index'

const COMPANY_ORDER = ['绿冷', '高分子', '氟硅', '有机硅']

export function useSalesDetail(detailType: string, targetDate: string) {
  const loading = ref(true)
  const detailLoading = ref(false)
  const companyList = ref<CompanySummaryMetric[]>([])
  const currentDetail = ref<CompanyDetailData | null>(null)
  const selectedId = ref(0)

  // 获取左侧公司列表
  async function fetchCompanyList() {
    loading.value = true
    try {
      const companies = await getSalesCompanies(detailType, targetDate)
      // 按照固定顺序排序
      companyList.value = companies.sort((a, b) => {
        const indexA = COMPANY_ORDER.findIndex(name => a.companyName.includes(name))
        const indexB = COMPANY_ORDER.findIndex(name => b.companyName.includes(name))
        const orderA = indexA === -1 ? COMPANY_ORDER.length : indexA
        const orderB = indexB === -1 ? COMPANY_ORDER.length : indexB
        return orderA - orderB
      })
    } catch (error) {
      console.error('获取公司列表失败:', error)
    } finally { 
      loading.value = false 
    }

    if (companyList.value.length > 0) {
      await handleSelectCompany(0)
    }
  }

  // 点击左侧公司，获取右侧深度明细
  async function handleSelectCompany(idx: number) {
    selectedId.value = idx
    const targetCompany = companyList.value[idx]
    if (!targetCompany?.companyName) return

    detailLoading.value = true
    try {
      currentDetail.value = await getSalesCompanyDetail(
        targetCompany.companyName, 
        detailType, 
        targetDate, 
        targetCompany.target
      )
    } catch (error) {
      console.error('获取公司明细失败:', error)
      currentDetail.value = null
    } finally { 
      detailLoading.value = false 
    }
  }

  return {
    loading,
    detailLoading,
    companyList,
    currentDetail,
    selectedId,
    fetchCompanyList,
    handleSelectCompany
  }
}