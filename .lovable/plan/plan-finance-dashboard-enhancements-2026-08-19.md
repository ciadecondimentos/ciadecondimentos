# Plan - Finance Dashboard Enhancements

The user wants to decouple manual finance entries (income/expenses) from the main dashboard's total revenue (which should reflect only sales) and add a comprehensive comparative chart in the finance section showing income, expenses, dates, values, and profit.

## Proposed Changes

### Backend (Server Functions)
- **`src/lib/dashboard.functions.ts`**:
    - Verify that `receitaTotal` and `vendasPorPeriodo` only use `crm_purchases` data (which is already the case).
    - Ensure no `finance_transactions` are mixed into the main dashboard revenue.
- **`src/lib/finance.functions.ts`**:
    - Add `getFinanceChartData` to fetch aggregated income and expenses by day for a specified date range.
    - Aggregation will include:
        - Income: Manual entries ('Entrada') + Sales (`crm_purchases.total_price`).
        - Expenses: Manual entries ('Saída') + Delivery costs (`crm_purchases.delivery_cost`).
    - Return a formatted array for `recharts`.

### Frontend (Finance Page)
- **`src/routes/financeiro/index.tsx`**:
    - Integrate `recharts` to display the new comparative chart.
    - Add a "Performance Dashboard" section at the top of the finance page.
    - Use an `AreaChart` to show the relationship between total income and expenses over time, plus a trend line for net profit.
    - Connect the chart to the existing date filters.

## Technical Details
- Use `sql` helper with `CAST(date AS DATE)` for consistent daily grouping across different tables.
- Handle empty states and loading skeletons for the new chart.
- Ensure the main dashboard remains focused strictly on sales performance as requested.

### Security
- RLS handles access to `crm_purchases` and `finance_transactions`.
- All data fetching is server-side via `createServerFn`.
