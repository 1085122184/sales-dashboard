// src/types/expense.ts

export interface ExpenseOverview {
  totalExpense: { amount: number; unit: string; yoyChange: number; yoyChangeText: string }
  salesExpense: { amount: number; unit: string; percent: number; yoyChange: number }
  managementExpense: { amount: number; unit: string; percent: number; yoyChange: number }
  financeExpense: { amount: number; unit: string; percent: number; yoyChange: number }
}

export interface CompanyExpense {
  name: string
  sales: number
  management: number
  finance: number
  total: number
  yoy: number
}

export interface ExpenseStructure {
  name: string
  value: number
  percent: number
}

export interface ExpenseTrend {
  months: string[]
  sales: number[]
  management: number[]
  finance: number[]
}

export interface CompanyDetailList {
  list: CompanyExpense[]
  total: number
  page: number
  pageSize: number
}