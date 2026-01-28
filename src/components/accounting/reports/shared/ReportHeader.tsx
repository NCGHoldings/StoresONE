import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  onExport?: () => void;
  onPrint?: () => void;
  children?: React.ReactNode;
}

export function ReportHeader({ title, subtitle, onExport, onPrint, children }: ReportHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {children}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
        {onPrint && (
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        )}
      </div>
    </div>
  );
}
