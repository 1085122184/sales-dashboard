import { ref } from 'vue'
import { getSalesCompanies, getSalesCompanyDetail } from '@/api/dashboard-api'
import type { CompanyDetailData, CompanySummaryMetric } from '@/types/index'
import { getCompanyCodeFromRecord, sortByCompanyOrder } from '@/utils/companyOrder'

export function useSalesDetail(detailType: string, targetDate: string) {
  const loading = ref(true)
  const detailLoading = ref(false)
  const companyList = ref<CompanySummaryMetric[]>([])
  const currentDetail = ref<CompanyDetailData | null>(null)
  const selectedId = ref(0)

  async function fetchCompanyList() {
    loading.value = true
    try {
      const companies = await getSalesCompanies(detailType, targetDate)
      companyList.value = sortByCompanyOrder(companies, item => item.companyName, getCompanyCodeFromRecord)
    } catch (error) {
      console.error('获取公司列表失败:', error)
      companyList.value = []
    } finally {
      loading.value = false
    }

    if (companyList.value.length > 0) {
      await handleSelectCompany(0)
    }
  }

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
