from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from openpyxl import load_workbook


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_ROOT / "excel" / "Investavimas Rima.xlsx"
DEFAULT_OUTPUT = PROJECT_ROOT / "public" / "data" / "rima"
SHEET_NAME = "Investavimas"


@dataclass(frozen=True)
class Section:
    name: str
    filename: str
    date_col: str
    invested_col: str
    contribution_col: str
    value_col: str
    profit_col: str
    rate_col: str
    result_col: str


SECTIONS = (
    Section("Fondai", "funds_history.json", "X", "Y", "Z", "AA", "AB", "AC", "AD"),
    Section("P2P", "p2p_history.json", "AF", "AG", "AH", "AI", "AJ", "AK", "AL"),
    Section("Visas portfelis", "portfolio_history.json", "AN", "AO", "AP", "AQ", "AR", "AS", "AT"),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generuoja Rimos Dashboard istorijos JSON failus.")
    parser.add_argument("input", nargs="?", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def as_number(value: Any, *, percent: bool = False) -> float:
    if value in (None, ""):
        return 0.0
    number = float(value)
    if not math.isfinite(number):
        raise ValueError(f"Netinkama skaitinė reikšmė: {value!r}")
    if percent:
        number *= 100
    return round(number, 2)


def as_date(value: Any) -> str | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, str):
        return datetime.fromisoformat(value.strip()).date().isoformat()
    raise ValueError(f"Neatpažinta data: {value!r}")


def read_history(ws: Any, section: Section) -> list[dict[str, Any]]:
    history: list[dict[str, Any]] = []

    for row in range(3, ws.max_row + 1):
        period = as_date(ws[f"{section.date_col}{row}"].value)
        if not period:
            continue

        item = {
            "date": period,
            "invested": as_number(ws[f"{section.invested_col}{row}"].value),
            "monthlyContribution": as_number(ws[f"{section.contribution_col}{row}"].value),
            "value": as_number(ws[f"{section.value_col}{row}"].value),
            "profit": as_number(ws[f"{section.profit_col}{row}"].value),
            "returnRate": as_number(ws[f"{section.rate_col}{row}"].value, percent=True),
            "monthlyResult": as_number(ws[f"{section.result_col}{row}"].value),
        }

        if any(item[key] != 0 for key in ("invested", "monthlyContribution", "value", "profit", "monthlyResult")):
            history.append(item)

    history.sort(key=lambda item: item["date"])
    if not history:
        raise ValueError(f"Skyriuje „{section.name}“ nerasta istorinių duomenų.")
    return history


def payload(section: Section, history: list[dict[str, Any]], source: Path) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "type": "monthlyPortfolioHistory",
        "section": section.name,
        "currency": "EUR",
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": {"file": source.name, "sheet": SHEET_NAME, "owner": "Rima"},
        "period": {"from": history[0]["date"], "to": history[-1]["date"], "months": len(history)},
        "latest": history[-1],
        "history": history,
    }


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    source = args.input.expanduser().resolve()
    output = args.output_dir.expanduser().resolve()

    if not source.is_file():
        print(f"KLAIDA: nerastas failas {source}")
        return 1

    print("=" * 66)
    print("RIMOS DASHBOARD IMPORTERIS V1.0")
    print("=" * 66)
    print(f"Excel:    {source}")
    print(f"Išvestis: {output}")

    workbook = load_workbook(source, data_only=True, read_only=True)
    if SHEET_NAME not in workbook.sheetnames:
        print(f"KLAIDA: nerastas lapas „{SHEET_NAME}“.")
        return 1

    ws = workbook[SHEET_NAME]
    for section in SECTIONS:
        history = read_history(ws, section)
        destination = output / section.filename
        write_json(destination, payload(section, history, source))
        latest = history[-1]
        print(f"[OK] {section.name}: {len(history)} mėn., {latest['date']}, {latest['value']:.2f} €")

    print("\nRimos Dashboard duomenys atnaujinti sėkmingai.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
