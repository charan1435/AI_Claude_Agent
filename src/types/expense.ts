import type { ExpenseCategory } from '@/lib/validation/expense'

/**
 * Shape of an expense row as returned by the API.
 */
export interface Expense {
  id: string
  user_id: string
  amount: number
  category: ExpenseCategory
  spent_on: string // YYYY-MM-DD
  note: string | null
  created_at: string
  updated_at: string
}
