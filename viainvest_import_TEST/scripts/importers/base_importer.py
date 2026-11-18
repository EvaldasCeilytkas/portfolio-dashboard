"""Bendros platformų importerių funkcijos ir vienodas rezultato formatas."""

from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable


def safe_number(value: Any) -> float:
    """Paverčia reikšmę į skaičių arba grąžina 0."""
    if value is None:
        return 0.0

    if isinstance(value, bool):
        return float(value)

    if isinstance(value, (int, float)):
        return float(value)

    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def round_number(value: Any, digits: int = 2) -> float:
    return round(safe_number(value), digits)


def create_slug(value: Any) -> str:
    """Sukuria URL tinkamą identifikatorių."""
    normalized = unicodedata.normalize("NFKD", str(value or ""))
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_text = ascii_text.lower().strip()
    ascii_text = re.sub(r"[^a-z0-9]+", "-", ascii_text)
    return ascii_text.strip("-")


def format_date(value: Any) -> str:
    """Paverčia datą į YYYY-MM-DD."""
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d")

    text = str(value or "").strip()
    return text


def format_period(value: Any) -> str:
    """Paverčia 2026.07, 2026-07 ar datą į YYYY-MM."""
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m")

    if isinstance(value, (int, float)):
        text = f"{value:.2f}"
    else:
        text = str(value or "").strip().replace(",", ".")

    match = re.fullmatch(r"(\d{4})[.-](\d{1,2})", text)

    if not match:
        return text

    year, month = match.groups()
    return f"{year}-{int(month):02d}"


def month_date(value: Any) -> str:
    """Paverčia mėnesį į YYYY-MM-01."""
    period = format_period(value)

    if re.fullmatch(r"\d{4}-\d{2}", period):
        return f"{period}-01"

    return period


def normalize_name(value: Any) -> str:
    return " ".join(str(value or "").strip().lower().split())


def normalize_history(
    history: Iterable[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Sutvarko ir chronologiškai surikiuoja platformos istoriją."""
    normalized: list[dict[str, Any]] = []

    for point in history:
        date_value = month_date(point.get("date") or point.get("period"))

        if not date_value:
            continue

        invested = safe_number(point.get("invested"))
        value = safe_number(point.get("value"))
        profit = point.get("profit")

        if profit is None:
            profit = value - invested

        normalized.append(
            {
                **point,
                "date": date_value,
                "invested": round(invested, 2),
                "value": round(value, 2),
                "profit": round(safe_number(profit), 2),
                "returnRate": round(
                    safe_number(point.get("returnRate")),
                    2,
                ),
            }
        )

    normalized.sort(key=lambda item: item["date"])
    return normalized


def add_monthly_performance(
    history: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Papildo istoriją pinigų srautu ir mėnesio rezultatu.

    Jei importeris pateikia tikslesnį cashFlow ar monthlyProfit,
    esamos reikšmės nėra perrašomos.
    """
    result: list[dict[str, Any]] = []

    for index, point in enumerate(normalize_history(history)):
        previous = result[index - 1] if index > 0 else None
        previous_value = (
            safe_number(previous.get("value")) if previous else 0.0
        )
        previous_invested = (
            safe_number(previous.get("invested")) if previous else 0.0
        )

        cash_flow = point.get("cashFlow")
        if cash_flow is None:
            cash_flow = safe_number(point.get("invested")) - previous_invested

        monthly_profit = point.get("monthlyProfit")
        if monthly_profit is None:
            monthly_profit = (
                safe_number(point.get("value"))
                - previous_value
                - safe_number(cash_flow)
            )

        monthly_return = point.get("monthlyReturn")
        if monthly_return is None:
            monthly_return = (
                safe_number(monthly_profit) / previous_value * 100
                if previous_value > 0
                else 0.0
            )

        result.append(
            {
                **point,
                "previousValue": round(
                    safe_number(
                        point.get("previousValue", previous_value)
                    ),
                    2,
                ),
                "cashFlow": round(safe_number(cash_flow), 2),
                "monthlyProfit": round(
                    safe_number(monthly_profit),
                    2,
                ),
                "monthlyReturn": round(
                    safe_number(monthly_return),
                    2,
                ),
                "currentValue": round(
                    safe_number(point.get("value")),
                    2,
                ),
            }
        )

    return result


def build_standard_result(
    *,
    platform_name: str,
    source_file: str | Path,
    history: list[dict[str, Any]],
    active_positions: list[dict[str, Any]] | None = None,
    sold_positions: list[dict[str, Any]] | None = None,
    summary: dict[str, Any] | None = None,
    module_type: str = "generic",
    cashflow: dict[str, Any] | None = None,
    updated_at: str = "",
) -> dict[str, Any]:
    """
    Sukuria vienodą rezultatą visiems platformų importeriams.

    Šį objektą update_portfolio.py gali prijungti prie bet kurios
    platformos be specialios platformai skirtos logikos.
    """
    active_positions = active_positions or []
    sold_positions = sold_positions or []
    platform_history = add_monthly_performance(history)
    latest = platform_history[-1] if platform_history else {}
    supplied_summary = summary or {}

    invested = safe_number(
        supplied_summary.get("invested", latest.get("invested"))
    )
    value = safe_number(
        supplied_summary.get("value", latest.get("value"))
    )
    profit = safe_number(
        supplied_summary.get(
            "profit",
            latest.get("profit", value - invested),
        )
    )
    return_rate = supplied_summary.get("returnRate")

    if return_rate is None:
        return_rate = profit / invested * 100 if invested else 0.0

    source_path = Path(source_file)

    if not updated_at:
        updated_at = latest.get("date", "")

    counts = {
        "active": len(active_positions),
        "sold": len(sold_positions),
        "total": len(active_positions) + len(sold_positions),
    }

    normalized_summary = {
        **supplied_summary,
        "invested": round(invested, 2),
        "value": round(value, 2),
        "profit": round(profit, 2),
        "returnRate": round(safe_number(return_rate), 2),
    }

    return {
        "schemaVersion": 1,
        "platformName": platform_name,
        "type": module_type,
        "sourceFile": source_path.name,
        "updatedAt": updated_at,
        "summary": normalized_summary,
        "history": platform_history,
        "cashflow": cashflow or {},
        "positions": {
            "active": active_positions,
            "sold": sold_positions,
            "all": active_positions + sold_positions,
            "counts": counts,
        },
        # Suderinamumas su jau veikiančiu React komponentu.
        "counts": counts,
        "holdings": active_positions,
        "active": active_positions,
        "sold": sold_positions,
        "modules": {
            "positions": bool(active_positions or sold_positions),
            "cashflow": bool(cashflow),
        },
    }
