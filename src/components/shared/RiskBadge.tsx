import React from "react";
import { RISK_LEVELS } from "../../config";
import { cn } from "../../lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const RiskBadge: React.FC<{
  riskLevel?: string;
  className?: string;
  showIcon?: boolean;
}> = ({ riskLevel = "LOW", className, showIcon = true }) => {
  const match = RISK_LEVELS.find((r) => r.value === riskLevel) || {
    label: riskLevel,
    color: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };

  const getIcon = () => {
    switch (riskLevel) {
      case "OVERDUE":
        return <Clock className="w-3 h-3 mr-1 text-red-600" />;
      case "HIGH":
        return <AlertCircle className="w-3 h-3 mr-1 text-orange-600" />;
      case "MEDIUM":
        return <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />;
      default:
        return <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        match.color,
        className
      )}
    >
      {showIcon && getIcon()}
      {match.label}
    </span>
  );
};
