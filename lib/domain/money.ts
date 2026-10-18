const MINOR_DIGITS: Record<string, number> = {
  CNY: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  HKD: 2,
  JPY: 0,
  KRW: 0,
  KWD: 3,
};

export function minorDigits(currency = "CNY"): number {
  return MINOR_DIGITS[currency.toUpperCase()] ?? 2;
}

export function toMinor(amount: number, currency = "CNY"): number {
  const digits = minorDigits(currency);
  return Math.round(amount * 10 ** digits);
}

export function fromMinor(minor: number, currency = "CNY"): number {
  const digits = minorDigits(currency);
  return minor / 10 ** digits;
}

export function currencySymbol(
  currency = "CNY",
  locale = "zh-CN",
): string {
  return (
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  );
}

export function formatMoney(
  minor: number,
  currency = "CNY",
  locale = "zh-CN",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: minorDigits(currency),
    maximumFractionDigits: minorDigits(currency),
  }).format(fromMinor(minor, currency));
}

export function formatMoneyPlain(
  minor: number,
  currency = "CNY",
  locale = "zh-CN",
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minorDigits(currency),
    maximumFractionDigits: minorDigits(currency),
  }).format(fromMinor(minor, currency));
}

export function formatCompact(minor: number, currency = "CNY"): string {
  return new Intl.NumberFormat("zh-CN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(fromMinor(minor, currency));
}

/** Parse user input such as "12.30" and return integer minor units. */
export function parseAmountInput(input: string, currency = "CNY"): number {
  const cleaned = input.replace(/[^\d.]/g, "");
  if (!cleaned) return 0;
  const [whole, ...rest] = cleaned.split(".");
  const digits = minorDigits(currency);
  const fraction = rest.join("").slice(0, digits).padEnd(digits, "0");
  const value = Number(`${whole || "0"}.${fraction || "0"}`);
  if (!Number.isFinite(value)) return 0;
  return toMinor(value, currency);
}

/** Format minor units for the amount keypad (no currency symbol). */
export function formatAmountInput(minor: number, currency = "CNY"): string {
  const digits = minorDigits(currency);
  if (minor === 0) return "";
  return fromMinor(minor, currency).toFixed(digits);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
