import type { MonthYear } from '../../schemas/common';
import { LabeledNumberField } from './fields';

interface OptionalMonthYearFieldsProps {
  idPrefix: string;
  monthLabel: string;
  yearLabel: string;
  value: MonthYear | undefined;
  onChange: (value: MonthYear | undefined) => void;
}

/**
 * A pair of Month/Year number inputs bound to an optional `MonthYear`
 * value (used by Education/Certifications/Awards/Publications/etc,
 * whose dates are optional unlike Experience's required `startDate`).
 */
export function OptionalMonthYearFields({
  idPrefix,
  monthLabel,
  yearLabel,
  value,
  onChange,
}: OptionalMonthYearFieldsProps) {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <LabeledNumberField
        id={`${idPrefix}-month`}
        label={monthLabel}
        min={1}
        max={12}
        value={value?.month}
        onChange={(month) =>
          onChange(month === undefined ? undefined : { month, year: value?.year ?? currentYear })
        }
      />
      <LabeledNumberField
        id={`${idPrefix}-year`}
        label={yearLabel}
        value={value?.year}
        onChange={(year) =>
          onChange(year === undefined ? undefined : { month: value?.month ?? 1, year })
        }
      />
    </>
  );
}
