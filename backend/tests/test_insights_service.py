from app.services.insights_service import InsightService


def test_high_shortage_generates_peak_and_shortage_recommendations() -> None:
    service = InsightService(shortage_threshold=15, high_shortage_threshold=30)

    result = service.generate(
        hour=18,
        location="downtown",
        demand=120,
        supply=60,
        gap=60,
        is_weekend=False,
    )

    assert result.severity == "high"
    assert any("peak commuting" in item.lower() for item in result.explanations)
    assert any("incentives" in item.lower() for item in result.recommendations)


def test_balanced_case_returns_stable_signal() -> None:
    service = InsightService()

    result = service.generate(
        hour=13,
        location="suburb",
        demand=35,
        supply=40,
        gap=-5,
        is_weekend=False,
    )

    assert result.severity == "balanced"
    assert any("balanced" in item.lower() for item in result.explanations)
