<script setup lang="ts">
import { computed } from 'vue'
import type { CompanyDetailData } from '@/types/index'

const props = defineProps<{
  detailData: CompanyDetailData
  unit: string
  metricName: string
}>()

const formatVal = (val: number) => {
  return Number(val || 0).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

const sortedTableProducts = computed(() => {
  if (!props.detailData) return []
  const map = new Map<string, { productCode: string; productName: string; value: number; percentage: number }>()
  let totalDataValue = 0
  
  props.detailData.products.forEach(p => {
    // 🌟 核心修复：统统换成 productCode 作为唯一主键！
    if (!map.has(p.productCode)) {
      map.set(p.productCode, { productCode: p.productCode, productName: p.productName, value: 0, percentage: 0 })
    }
    map.get(p.productCode)!.value += p.value
    totalDataValue += p.value
  })
  
  return Array.from(map.values()).map(item => {
    item.percentage = totalDataValue > 0 ? +((item.value / totalDataValue) * 100).toFixed(1) : 0
    return item
  }).sort((a, b) => b.value - a.value)
})

const tableTotalValue = computed(() => sortedTableProducts.value.reduce((sum, p) => sum + p.value, 0))
const tableTotalPct   = computed(() => {
  const sum = sortedTableProducts.value.reduce((sum, p) => sum + p.percentage, 0)
  return +(sum.toFixed(1))
})
</script>

<template>
  <div class="product-tbl">
    <table>
      <thead>
        <tr>
          <th>产品名称</th>
          <th class="ta-r">{{ metricName }}</th>
          <th class="ta-r">构成比</th>
          <th class="col-bar">贡献度</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, i) in sortedTableProducts" :key="p.productCode">
          <td><span class="rk">{{ i + 1 }}</span>{{ p.productName }}</td>
          <td class="ta-r mono">{{ formatVal(p.value) }}{{ unit }}</td>
          <td class="ta-r"><span class="pct-txt">{{ p.percentage }}%</span></td>
          <td class="col-bar"><div class="pct-bar-bg"><div class="pct-bar-fill" :style="{ width: p.percentage + '%' }"></div></div></td>
        </tr>
        <tr class="tr-total">
          <td><span class="total-label">合计</span></td>
          <td class="ta-r mono">{{ formatVal(tableTotalValue) }}{{ unit }}</td>
          <td class="ta-r"><span class="pct-txt">{{ tableTotalPct }}%</span></td>
          <td class="col-bar"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.product-tbl { width: 100%; margin-top: 12px; overflow-x: auto; }
.product-tbl table { width: 100%; border-collapse: collapse; min-width: 380px; }
.product-tbl th { padding: 12px 10px; font-size: 14px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #f1f5f9; }
.product-tbl td { padding: 14px 10px; font-size: 15px; color: #475569; border-bottom: 1px solid #f8fafc; }
.ta-r  { text-align: right; }
.col-bar { width: 80px; }
.mono  { font-weight: 700; font-size: 16px; color: #1e293b; }
.rk    { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; font-size: 12px; font-weight: 700; color: #94a3b8; margin-right: 8px; }
.pct-bar-bg  { display: inline-block; width: 60px; height: 5px; background: #f1f5f9; border-radius: 99px; vertical-align: middle; overflow: hidden; }
.pct-bar-fill { height: 100%; background: #3182ce; border-radius: 99px; }
.pct-txt { font-size: 14px; font-weight: 500; color: #64748b; }
.tr-total td { border-top: 2px solid #e2e8f0 !important; border-bottom: none !important; padding-top: 16px !important; }
.total-label { font-size: 15px; font-weight: 800; color: #1e293b; }
.tr-total .mono { color: #3182ce; font-size: 17px; }

@media (max-width: 767px) {
  .col-bar { display: none; }
}
</style>