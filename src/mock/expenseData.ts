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
  currentYtdValue: number; // 本年累计值(万)
  yoyYtdValue: number;     // 去年同期累计值(万)
  yoyYtd: number;          // 累计同比增长率 %
}

export const companyGrowthDataMock: CompanyGrowthPoint[] = [
  { companyName: '华东分公司', currentValue: 120, yoyValue: 110, momValue: 115, yoy: 9.1, mom: 4.3, currentYtdValue: 560, yoyYtdValue: 520, yoyYtd: 7.7 },
  { companyName: '华南分公司', currentValue: 85, yoyValue: 95, momValue: 80, yoy: -10.5, mom: 6.3, currentYtdValue: 410, yoyYtdValue: 450, yoyYtd: -8.9 },
  { companyName: '华北分公司', currentValue: 140, yoyValue: 135, momValue: 145, yoy: 3.7, mom: -3.4, currentYtdValue: 690, yoyYtdValue: 650, yoyYtd: 6.2 },
  { companyName: '西南分公司', currentValue: 75, yoyValue: 70, momValue: 74, yoy: 7.1, mom: 1.4, currentYtdValue: 360, yoyYtdValue: 340, yoyYtd: 5.9 },
  { companyName: '西北分公司', currentValue: 60, yoyValue: 65, momValue: 62, yoy: -7.7, mom: -3.2, currentYtdValue: 290, yoyYtdValue: 310, yoyYtd: -6.5 }
]
