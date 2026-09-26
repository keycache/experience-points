import type { MonthYear } from '../schemas/common';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Formats a `MonthYear` as e.g. "Mar 2021", matching specification.md section 8.1's example. */
export function formatMonthYear(monthYear: MonthYear | undefined): string {
  if (!monthYear) {
    return '';
  }
  return `${MONTH_LABELS[monthYear.month - 1] ?? monthYear.month} ${monthYear.year}`;
}
