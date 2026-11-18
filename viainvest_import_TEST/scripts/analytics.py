from __future__ import annotations

from statistics import pstdev
from typing import Any


def _safe_float(value: Any) -> float:
    """Paverčia reikšmę į float arba grąžina 0."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _round(value: float, digits: int = 2) -> float:
    """Saugiai suapvalina skaičių."""
    return round(float(value), digits)


def _get_clean_history(
    history: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Grąžina chronologiškai surūšiuotą istoriją.

    Įrašai be datos praleidžiami.
    """
    clean_history = [
        point
        for point in history
        if isinstance(point, dict) and point.get("date")
    ]

    return sorted(
        clean_history,
        key=lambda point: str(point.get("date", "")),
    )


def calculate_monthly_performance(
    history: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Apskaičiuoja tikrą mėnesio investicinį rezultatą,
    eliminuodama įnašų ir išėmimų įtaką.

    Formulė:
        pinigų srautas = dabartinė investuota suma - ankstesnė investuota suma

        mėnesio pelnas =
            dabartinė vertė
            - ankstesnė vertė
            - pinigų srautas

        mėnesio grąža =
            mėnesio pelnas / ankstesnė vertė * 100

    Teigiamas cashFlow reiškia papildomą įnašą.
    Neigiamas cashFlow reiškia lėšų išėmimą.

    Kadangi Excel istorijoje nėra tikslios pinigų srauto dienos,
    skaičiavimas daro prielaidą, kad srautas įvyko laikotarpio pabaigoje.
    """
    clean_history = _get_clean_history(history)
    monthly_performance: list[dict[str, Any]] = []

    for index in range(1, len(clean_history)):
        previous_point = clean_history[index - 1]
        current_point = clean_history[index]

        previous_value = _safe_float(previous_point.get("value"))
        current_value = _safe_float(current_point.get("value"))

        previous_invested = _safe_float(
            previous_point.get("invested")
        )
        current_invested = _safe_float(
            current_point.get("invested")
        )

        cash_flow = current_invested - previous_invested
        monthly_profit = (
            current_value
            - previous_value
            - cash_flow
        )

        monthly_return = (
            monthly_profit / previous_value * 100
            if previous_value > 0
            else 0.0
        )

        monthly_performance.append(
            {
                "date": current_point["date"],
                "previousValue": _round(previous_value),
                "currentValue": _round(current_value),
                "previousInvested": _round(previous_invested),
                "currentInvested": _round(current_invested),
                "cashFlow": _round(cash_flow),
                "monthlyProfit": _round(monthly_profit),
                "monthlyReturn": _round(monthly_return),
            }
        )

    return monthly_performance


def _calculate_max_drawdown(
    history: list[dict[str, Any]],
) -> float:
    """
    Apskaičiuoja didžiausią vertės kritimą nuo ankstesnio piko.

    Šis rodiklis vertina portfelio vertės kreivę. Jis nėra eliminuotas
    nuo pinigų srautų, todėl rodo faktinės vertės nuosmukį.
    """
    peak = 0.0
    max_drawdown = 0.0

    for point in history:
        value = _safe_float(point.get("value"))

        if value > peak:
            peak = value

        if peak <= 0:
            continue

        drawdown = (value - peak) / peak * 100

        if drawdown < max_drawdown:
            max_drawdown = drawdown

    return max_drawdown


def calculate_platform_analytics(
    history: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Apskaičiuoja vienos platformos istorinius rodiklius.

    Mėnesio grąžos rodikliai skaičiuojami eliminuojant
    papildomų įnašų ir išėmimų poveikį.
    """
    clean_history = _get_clean_history(history)

    if not clean_history:
        return {
            "startDate": "",
            "endDate": "",
            "months": 0,
            "highestValue": 0.0,
            "lowestValue": 0.0,
            "averageMonthlyReturn": 0.0,
            "bestMonth": 0.0,
            "worstMonth": 0.0,
            "winningMonths": 0,
            "losingMonths": 0,
            "flatMonths": 0,
            "winningRate": 0.0,
            "maxDrawdown": 0.0,
            "volatility": 0.0,
            "monthlyPerformance": [],
        }

    values = [
        _safe_float(point.get("value"))
        for point in clean_history
    ]
    non_zero_values = [
        value
        for value in values
        if value > 0
    ]

    monthly_performance = calculate_monthly_performance(
        clean_history
    )
    monthly_returns = [
        _safe_float(point.get("monthlyReturn"))
        for point in monthly_performance
    ]

    epsilon = 0.000001

    winning_months = sum(
        1
        for value in monthly_returns
        if value > epsilon
    )
    losing_months = sum(
        1
        for value in monthly_returns
        if value < -epsilon
    )
    flat_months = sum(
        1
        for value in monthly_returns
        if -epsilon <= value <= epsilon
    )

    measured_months = len(monthly_returns)

    winning_rate = (
        winning_months / measured_months * 100
        if measured_months > 0
        else 0.0
    )

    average_monthly_return = (
        sum(monthly_returns) / measured_months
        if measured_months > 0
        else 0.0
    )

    volatility = (
        pstdev(monthly_returns)
        if len(monthly_returns) > 1
        else 0.0
    )

    return {
        "startDate": clean_history[0]["date"],
        "endDate": clean_history[-1]["date"],
        "months": len(clean_history),
        "highestValue": _round(max(values), 2),
        "lowestValue": _round(
            min(non_zero_values) if non_zero_values else 0.0,
            2,
        ),
        "averageMonthlyReturn": _round(
            average_monthly_return,
            2,
        ),
        "bestMonth": _round(
            max(monthly_returns) if monthly_returns else 0.0,
            2,
        ),
        "worstMonth": _round(
            min(monthly_returns) if monthly_returns else 0.0,
            2,
        ),
        "winningMonths": winning_months,
        "losingMonths": losing_months,
        "flatMonths": flat_months,
        "winningRate": _round(winning_rate, 2),
        "maxDrawdown": _round(
            _calculate_max_drawdown(clean_history),
            2,
        ),
        "volatility": _round(volatility, 2),
        "monthlyPerformance": monthly_performance,
    }


def calculate_portfolio_analytics(
    history: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Apskaičiuoja viso portfelio analitiką.

    Naudojama ta pati pinigų srautus eliminuojanti metodika
    kaip ir atskiroms platformoms.
    """
    return calculate_platform_analytics(history)