-- Migration: 0001_init_expenses
-- PROJ-3: expenses table, RLS policies, indexes, updated_at trigger

-- ============================================================
-- Table: public.expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id         uuid            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     numeric(12, 2)  NOT NULL CHECK (amount > 0),
  category   text            NOT NULL CHECK (category IN ('Food', 'Transport', 'Bills', 'Other')),
  spent_on   date            NOT NULL,
  note       text            NULL,
  created_at timestamptz     NOT NULL DEFAULT now(),
  updated_at timestamptz     NOT NULL DEFAULT now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- SELECT: user can only see their own rows
CREATE POLICY "expenses_select_own"
  ON public.expenses
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: user can only insert rows they own
CREATE POLICY "expenses_insert_own"
  ON public.expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: user can only update rows they own (both USING and WITH CHECK)
CREATE POLICY "expenses_update_own"
  ON public.expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: user can only delete rows they own
CREATE POLICY "expenses_delete_own"
  ON public.expenses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================

-- Primary list-view index: user's expenses sorted newest-first by date
CREATE INDEX IF NOT EXISTS idx_expenses_user_spent_on
  ON public.expenses (user_id, spent_on DESC);

-- Category breakdown / filter index
CREATE INDEX IF NOT EXISTS idx_expenses_user_category_spent_on
  ON public.expenses (user_id, category, spent_on);

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
