/**
 * version: 1.1.0
 * Frontend helper for formatting catalog prices with rounding precision.
 * Provides reusable function to render monetary values with currency symbol.
 * File: helper.format.price.ts (frontend)
 *
 * Changes in v1.1.0:
 * - Moved helper from catalog module into shared helpers directory
 */

interface FormatPriceOptions {
  price: number | null | undefined;
  currencySymbol: string | null | undefined;
  roundingPrecision: number | null | undefined;
  locale?: string | null;
}

/**
 * Format monetary value with currency symbol respecting rounding precision.
 */
export function formatPriceWithPrecision({
  price,
  currencySymbol,
  roundingPrecision,
  locale
}: FormatPriceOptions): string | null {
  if (price === null || price === undefined || Number.isNaN(price)) {
    return null;
  }

  const precision =
    typeof roundingPrecision === 'number' && roundingPrecision >= 0
      ? roundingPrecision
      : 2;

  const formatter = new Intl.NumberFormat(locale ?? undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });

  const numberPart = formatter.format(price);
  const symbol = currencySymbol ?? '';

  return symbol ? `${numberPart} ${symbol}` : numberPart;
}


