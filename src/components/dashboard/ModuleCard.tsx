import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  stats?: { label: string; value: string | number }[];
  color: string;
}

export function ModuleCard({
  title,
  description,
  icon,
  path,
  stats,
  color,
}: ModuleCardProps) {
  return (
    <Link to={path} className="module-card block group">
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            <ArrowRight
              size={18}
              className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {stats && (
            <div className="flex gap-4 mt-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
