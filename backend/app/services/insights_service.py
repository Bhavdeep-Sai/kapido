from __future__ import annotations

from dataclasses import dataclass

PEAK_HOURS = {7, 8, 9, 10, 17, 18, 19, 20, 21}


@dataclass(frozen=True)
class InsightResult:
    severity: str
    explanations: list[str]
    recommendations: list[str]


class InsightService:
    def __init__(self, shortage_threshold: float = 15.0, high_shortage_threshold: float = 30.0) -> None:
        self.shortage_threshold = shortage_threshold
        self.high_shortage_threshold = high_shortage_threshold

    def generate(self, hour: int, location: str, demand: float, supply: float, gap: float, is_weekend: bool) -> InsightResult:
        explanations: list[str] = []
        recommendations: list[str] = []

        if hour in PEAK_HOURS:
            explanations.append("High demand during peak commuting hours.")
            recommendations.append("Deploy more drivers during peak commute windows.")

        if is_weekend:
            explanations.append("Weekend travel patterns can increase demand volatility.")

        if gap >= self.high_shortage_threshold:
            explanations.append("Driver supply is significantly below expected demand in this region.")
            recommendations.append(f"Increase driver incentives around {location} immediately.")
            recommendations.append("Enable surge pricing safeguards to rebalance demand and supply.")
            severity = "high"
        elif gap >= self.shortage_threshold:
            explanations.append("Demand currently exceeds active driver supply.")
            recommendations.append(f"Reposition nearby idle drivers toward {location}.")
            recommendations.append("Trigger short-term incentive notifications in nearby zones.")
            severity = "medium"
        elif gap > 0:
            explanations.append("Mild shortage detected with manageable imbalance.")
            recommendations.append("Monitor this zone and pre-emptively nudge drivers to move in.")
            severity = "low"
        else:
            explanations.append("Supply is currently balanced or higher than demand.")
            recommendations.append("Maintain current allocation and monitor for sudden demand spikes.")
            severity = "balanced"

        utilization = demand / max(supply, 1.0)
        if utilization > 1.5:
            explanations.append("Demand-to-supply utilization is elevated, indicating service pressure.")
        if supply < 10:
            explanations.append("Low absolute driver availability may increase rider wait times.")
            recommendations.append("Prioritize dispatch boosts for low-coverage areas.")

        return InsightResult(
            severity=severity,
            explanations=list(dict.fromkeys(explanations)),
            recommendations=list(dict.fromkeys(recommendations)),
        )
