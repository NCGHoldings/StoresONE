import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  disabled?: boolean;
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ExportButton({ data, filename, disabled }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportToCSV(data, filename)}
      disabled={disabled || !data.length}
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
