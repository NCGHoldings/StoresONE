import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PeriodType, DateRange } from "@/hooks/useFinancialReports";

interface ReportPeriodPickerProps {
  periodType: PeriodType;
  onPeriodTypeChange: (type: PeriodType) => void;
  customRange?: DateRange;
  onCustomRangeChange?: (range: DateRange) => void;
  showAsOfDate?: boolean;
  asOfDate?: string;
  onAsOfDateChange?: (date: string) => void;
}

export function ReportPeriodPicker({
  periodType,
  onPeriodTypeChange,
  customRange,
  onCustomRangeChange,
  showAsOfDate,
  asOfDate,
  onAsOfDateChange,
}: ReportPeriodPickerProps) {
  if (showAsOfDate) {
    return (
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">As of:</Label>
        <Input
          type="date"
          value={asOfDate}
          onChange={(e) => onAsOfDateChange?.(e.target.value)}
          className="w-40"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={periodType} onValueChange={(v) => onPeriodTypeChange(v as PeriodType)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="quarter">This Quarter</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {periodType === "custom" && customRange && onCustomRangeChange && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customRange.start}
            onChange={(e) => onCustomRangeChange({ ...customRange, start: e.target.value })}
            className="w-36"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={customRange.end}
            onChange={(e) => onCustomRangeChange({ ...customRange, end: e.target.value })}
            className="w-36"
          />
        </div>
      )}
    </div>
  );
}
