/**
 * 三费监控 Mock 数据
 */

export interface CompanyGrowthPoint {
  companyName: string;
  currentValue: number;    // 本期值(万)
  yoyValue: number;        // 去年同期值(万)
  momValue: number;        // 上期环比值(万)
  yoy: number;             // 同比增长率 %
  mom: number;             // 环比增长率 %
}

export const companyGrowthDataMock: CompanyGrowthPoint[] = [
  { companyName: '华东分公司', currentValue: 120, yoyValue: 110, momValue: 115, yoy: 9.1, mom: 4.3 },
  { companyName: '华南分公司', currentValue: 85, yoyValue: 95, momValue: 80, yoy: -10.5, mom: 6.3 },
  { companyName: '华北分公司', currentValue: 140, yoyValue: 135, momValue: 145, yoy: 3.7, mom: -3.4 },
  { companyName: '西南分公司', currentValue: 75, yoyValue: 70, momValue: 74, yoy: 7.1, mom: 1.4 },
  { companyName: '西北分公司', currentValue: 60, yoyValue: 65, momValue: 62, yoy: -7.7, mom: -3.2 }
]
