import { useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useConfigValue } from "@/hooks/useSystemConfig";

// Map config date format to date-fns format
const DATE_FORMAT_MAP: Record<string, string> = {
  "MM/DD/YYYY": "MM/dd/yyyy",
  "DD/MM/YYYY": "dd/MM/yyyy",
  "YYYY-MM-DD": "yyyy-MM-dd",
  "DD.MM.YYYY": "dd.MM.yyyy",
  "DD-MM-YYYY": "dd-MM-yyyy",
  "YYYY/MM/DD": "yyyy/MM/dd",
};

/**
 * Hook to format currency values using system-wide configuration
 */
export function useFormatCurrency() {
  const defaultCurrency = useConfigValue<string>("default_currency", "USD");

  return useCallback(
    (amount: number | null | undefined, overrideCurrency?: string): string => {
      if (amount === null || amount === undefined) return "-";
      const currency = overrideCurrency || defaultCurrency;

      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        // Fallback for invalid currency codes
        return `${currency} ${amount.toFixed(2)}`;
      }
    },
    [defaultCurrency]
  );
}

/**
 * Hook to format dates using system-wide configuration
 */
export function useFormatDate() {
  const dateFormat = useConfigValue<string>("date_format", "MM/DD/YYYY");

  const dateFnsFormat = useMemo(
    () => DATE_FORMAT_MAP[dateFormat] || "MM/dd/yyyy",
    [dateFormat]
  );

  return useCallback(
    (
      date: Date | string | null | undefined,
      formatOverride?: string
    ): string => {
      if (!date) return "-";

      try {
        const dateObj = typeof date === "string" ? parseISO(date) : date;
        const formatToUse = formatOverride
          ? DATE_FORMAT_MAP[formatOverride] || formatOverride
          : dateFnsFormat;
        return format(dateObj, formatToUse);
      } catch {
        return typeof date === "string" ? date : "-";
      }
    },
    [dateFnsFormat]
  );
}

/**
 * Hook to format datetime using system-wide configuration
 */
export function useFormatDateTime() {
  const dateFormat = useConfigValue<string>("date_format", "MM/DD/YYYY");

  const dateFnsFormat = useMemo(
    () => DATE_FORMAT_MAP[dateFormat] || "MM/dd/yyyy",
    [dateFormat]
  );

  return useCallback(
    (date: Date | string | null | undefined): string => {
      if (!date) return "-";

      try {
        const dateObj = typeof date === "string" ? parseISO(date) : date;
        return format(dateObj, `${dateFnsFormat} HH:mm`);
      } catch {
        return typeof date === "string" ? date : "-";
      }
    },
    [dateFnsFormat]
  );
}

/**
 * Hook to get PO number prefix from system config
 */
export function usePOPrefix(): string {
  return useConfigValue<string>("po_number_prefix", "PO-");
}

/**
 * Hook to get default payment terms from system config
 */
export function useDefaultPaymentTerms(): number {
  return useConfigValue<number>("default_payment_terms", 30);
}

/**
 * Hook to get default currency from system config
 */
export function useDefaultCurrency(): string {
  return useConfigValue<string>("default_currency", "USD");
}

/**
 * Hook to get approval threshold from system config
 */
export function useApprovalThreshold(): number {
  return useConfigValue<number>("approval_threshold", 10000);
}

/**
 * Non-hook utility for static currency formatting (use in non-component code)
 */
export function formatCurrencyStatic(
  amount: number | null | undefined,
  currency: string = "USD"
): string {
  if (amount === null || amount === undefined) return "-";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Non-hook utility for static date formatting (use in non-component code)
 */
export function formatDateStatic(
  date: Date | string | null | undefined,
  dateFormatConfig: string = "MM/DD/YYYY"
): string {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const dateFnsFormat = DATE_FORMAT_MAP[dateFormatConfig] || "MM/dd/yyyy";
    return format(dateObj, dateFnsFormat);
  } catch {
    return typeof date === "string" ? date : "-";
  }
}
