import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  label: string;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
}

export function ScoreGauge({
  score,
  maxScore = 100,
  label,
  size = "md",
  showPercentage = true,
}: ScoreGaugeProps) {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  
  const getColorClass = (pct: number) => {
    if (pct >= 80) return "text-success";
    if (pct >= 60) return "text-warning";
    return "text-destructive";
  };

  const getStrokeColor = (pct: number) => {
    if (pct >= 80) return "stroke-success";
    if (pct >= 60) return "stroke-warning";
    return "stroke-destructive";
  };

  const sizeConfig = {
    sm: { width: 60, strokeWidth: 4, fontSize: "text-sm" },
    md: { width: 80, strokeWidth: 6, fontSize: "text-lg" },
    lg: { width: 100, strokeWidth: 8, fontSize: "text-xl" },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* Background circle */}
        <svg
          className="transform -rotate-90"
          width={config.width}
          height={config.width}
        >
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-muted"
          />
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-500", getStrokeColor(percentage))}
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", config.fontSize, getColorClass(percentage))}>
            {showPercentage ? `${Math.round(percentage)}%` : score}
          </span>
        </div>
      </div>
      
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}
