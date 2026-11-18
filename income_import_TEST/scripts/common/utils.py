from __future__ import annotations

import math
import re
from datetime import date, datetime
from typing import Any

EPSILON = 0.000001
MONTH_SHEET_RE = re.compile(r"^\d{4}\.\d{2}$")


def finite_number(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    return number if math.isfinite(number) else default


def rounded(value: Any, digits: int = 2) -> float:
    return round(finite_number(value), digits)


def nullable_number(value: Any, digits: int = 4) -> float | None:
    if value is None:
        return None

    number = finite_number(value, float("nan"))
    if not math.isfinite(number):
        return None

    return round(number, digits)


def month_key(value: Any) -> str | None:
    if isinstance(value, (datetime, date)):
        return f"{value.year:04d}-{value.month:02d}"

    if isinstance(value, (int, float)):
        text = f"{float(value):.2f}"
    else:
        text = str(value or "").strip().replace(",", ".")

    match = re.fullmatch(r"(\d{4})\.(\d{1,2})", text)
    if not match:
        return None

    year = int(match.group(1))
    month = int(match.group(2))

    if not 1 <= month <= 12:
        return None

    return f"{year:04d}-{month:02d}"


def month_start(value: Any) -> str | None:
    key = month_key(value)
    return f"{key}-01" if key else None


def month_end(value: Any) -> str | None:
    key = month_key(value)
    if not key:
        return None

    year, month = map(int, key.split("-"))

    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)

    return date.fromordinal(next_month.toordinal() - 1).isoformat()


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def is_month_sheet(name: str) -> bool:
    return bool(MONTH_SHEET_RE.fullmatch(name))


def find_month_rows(ws, start_row: int = 1) -> list[int]:
    return [
        row
        for row in range(start_row, ws.max_row + 1)
        if month_key(ws.cell(row, 1).value)
    ]


def find_last_month_row(ws, start_row: int = 1) -> int:
    rows = find_month_rows(ws, start_row=start_row)

    if not rows:
        raise ValueError(
            f"Lape „{ws.title}“ nerasta mėnesinių duomenų."
        )

    return rows[-1]
