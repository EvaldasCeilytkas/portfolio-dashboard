from __future__ import annotations

import argparse
import json
import math
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT_DIR = PROJECT_ROOT / "public" / "data" / "platforms"
DEFAULT_OUTPUT = PROJECT_ROOT / "public" / "data" / "portfolio.json"

GROUP_NAMES = {
    "funds": "Fondai",
    "brokerage": "Brokeriai",
    "robo": "Robo",
    "p2p": "P2P",
    "real_estate": "NT sutelktinis finansavimas",
}

REQUIRED_PLATFORM_KEYS = {
    "schemaVersion",
    "generatedAt",
    "platform",
    "summary",
    "history",
    "investments",
}

REQUIRED_SUMMARY_KEYS = {
    "invested",
    "currentValue",
    "profit",
    "returnRate",
    "xirr",
    "cash",
    "incomeReceived",
    "activeInvestments",
    "delayedInvestments",
    "completedInvestments",
}


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


def weighted_average(
    items: list[dict[str, Any]],
    field: str,
    *,
    weight_field: str = "currentValue",
) -> float | None:
    weighted_sum = 0.0
    total_weight = 0.0

    for item in items:
        value = item.get("summary", {}).get(field)
        if value is None:
            continue

        weight = max(finite_number(item.get("summary", {}).get(weight_field)), 0.0)
        if weight <= 0:
            weight = max(finite_number(item.get("summary", {}).get("invested")), 0.0)
        if weight <= 0:
            continue

        weighted_sum += finite_number(value) * weight
        total_weight += weight

    if total_weight <= 0:
        return None

    return round(weighted_sum / total_weight, 4)


def validate_platform_document(data: Any, path: Path) -> None:
    if not isinstance(data, dict):
        raise ValueError(f"{path.name}: JSON šaknis turi būti objektas.")

    missing = REQUIRED_PLATFORM_KEYS - set(data)
    if missing:
        raise ValueError(
            f"{path.name}: trūksta laukų: {', '.join(sorted(missing))}."
        )

    if data.get("schemaVersion") != 1:
        raise ValueError(
            f"{path.name}: nepalaikoma schemaVersion={data.get('schemaVersion')}."
        )

    platform = data.get("platform")
    summary = data.get("summary")

    if not isinstance(platform, dict):
        raise ValueError(f"{path.name}: 'platform' turi būti objektas.")
    if not isinstance(summary, dict):
        raise ValueError(f"{path.name}: 'summary' turi būti objektas.")

    slug = str(platform.get("slug") or "").strip()
    name = str(platform.get("name") or "").strip()
    if not slug or not name:
        raise ValueError(f"{path.name}: platformoje trūksta slug arba name.")

    missing_summary = REQUIRED_SUMMARY_KEYS - set(summary)
    if missing_summary:
        raise ValueError(
            f"{path.name}: summary trūksta laukų: "
            + ", ".join(sorted(missing_summary))
            + "."
        )

    if not isinstance(data.get("history"), list):
        raise ValueError(f"{path.name}: 'history' turi būti masyvas.")
    if not isinstance(data.get("investments"), list):
        raise ValueError(f"{path.name}: 'investments' turi būti masyvas.")


def load_platforms(input_dir: Path) -> list[dict[str, Any]]:
    if not input_dir.is_dir():
        raise FileNotFoundError(f"Platformų katalogas nerastas: {input_dir}")

    paths = sorted(input_dir.glob("*.json"))
    if not paths:
        raise FileNotFoundError(
            f"Kataloge nėra platformų JSON failų: {input_dir}"
        )

    platforms: list[dict[str, Any]] = []
    slugs: set[str] = set()

    for path in paths:
        with path.open("r", encoding="utf-8-sig") as file:
            data = json.load(file)

        validate_platform_document(data, path)
        slug = data["platform"]["slug"]

        if slug in slugs:
            raise ValueError(f"Dubliuota platforma: {slug}")
        slugs.add(slug)

        data["_sourceFile"] = path.name
        platforms.append(data)

    return platforms


def build_platform_cards(
    platform_documents: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []

    for document in platform_documents:
        platform = document["platform"]
        summary = document["summary"]

        cards.append({
            "id": platform["id"],
            "slug": platform["slug"],
            "name": platform["name"],
            "group": platform["group"],
            "type": platform["type"],
            "category": platform["category"],
            "currency": platform["currency"],
            "active": bool(platform["active"]),
            "startDate": platform.get("startDate"),
            "updatedAt": platform["updatedAt"],
            "website": platform.get("website"),
            "sourceFile": document["_sourceFile"],
            "summary": {
                "invested": rounded(summary["invested"]),
                "currentValue": rounded(summary["currentValue"]),
                "profit": rounded(summary["profit"]),
                "returnRate": nullable_number(summary.get("returnRate")),
                "xirr": nullable_number(summary.get("xirr")),
                "cash": rounded(summary["cash"]),
                "incomeReceived": rounded(summary["incomeReceived"]),
                "activeInvestments": int(summary["activeInvestments"]),
                "delayedInvestments": int(summary["delayedInvestments"]),
                "completedInvestments": int(summary["completedInvestments"]),
                "averageRate": nullable_number(summary.get("averageRate")),
                "averageLtv": nullable_number(summary.get("averageLtv")),
            },
        })

    return sorted(
        cards,
        key=lambda item: (-item["summary"]["currentValue"], item["name"].lower()),
    )


def build_summary(cards: list[dict[str, Any]]) -> dict[str, Any]:
    invested = rounded(sum(item["summary"]["invested"] for item in cards))
    current_value = rounded(
        sum(item["summary"]["currentValue"] for item in cards)
    )
    profit = rounded(sum(item["summary"]["profit"] for item in cards))
    cash = rounded(sum(item["summary"]["cash"] for item in cards))
    income = rounded(
        sum(item["summary"]["incomeReceived"] for item in cards)
    )

    return_rate = (
        round(profit / invested * 100, 4)
        if abs(invested) > 0.000001
        else None
    )

    return {
        "invested": invested,
        "currentValue": current_value,
        "profit": profit,
        "returnRate": return_rate,
        "xirr": weighted_average(cards, "xirr"),
        "cash": cash,
        "incomeReceived": income,
        "platformCount": len(cards),
        "activeInvestments": sum(
            item["summary"]["activeInvestments"] for item in cards
        ),
        "delayedInvestments": sum(
            item["summary"]["delayedInvestments"] for item in cards
        ),
        "completedInvestments": sum(
            item["summary"]["completedInvestments"] for item in cards
        ),
    }


def build_allocation(cards: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "invested": 0.0,
            "currentValue": 0.0,
            "profit": 0.0,
            "cash": 0.0,
            "platformCount": 0,
        }
    )

    for item in cards:
        group = item["group"]
        target = grouped[group]
        target["invested"] += item["summary"]["invested"]
        target["currentValue"] += item["summary"]["currentValue"]
        target["profit"] += item["summary"]["profit"]
        target["cash"] += item["summary"]["cash"]
        target["platformCount"] += 1

    total_value = sum(value["currentValue"] for value in grouped.values())
    result: list[dict[str, Any]] = []

    for group, values in grouped.items():
        current_value = rounded(values["currentValue"])
        result.append({
            "group": group,
            "name": GROUP_NAMES.get(group, group),
            "invested": rounded(values["invested"]),
            "currentValue": current_value,
            "profit": rounded(values["profit"]),
            "cash": rounded(values["cash"]),
            "percentage": (
                round(current_value / total_value * 100, 4)
                if abs(total_value) > 0.000001
                else 0.0
            ),
            "platformCount": int(values["platformCount"]),
        })

    return sorted(result, key=lambda item: -item["currentValue"])


def normalized_history(document: dict[str, Any]) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []

    for entry in document.get("history", []):
        if not isinstance(entry, dict) or not entry.get("date"):
            continue

        entries.append({
            "date": str(entry["date"]),
            "invested": rounded(entry.get("invested")),
            "value": rounded(entry.get("value")),
            "profit": rounded(entry.get("profit")),
            "cash": rounded(entry.get("cash")),
            "income": rounded(entry.get("income")),
        })

    entries.sort(key=lambda item: item["date"])
    return entries


def build_history(
    platform_documents: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    histories = {
        document["platform"]["slug"]: normalized_history(document)
        for document in platform_documents
    }

    all_dates = sorted({
        entry["date"]
        for entries in histories.values()
        for entry in entries
    })

    result: list[dict[str, Any]] = []

    for current_date in all_dates:
        aggregate = {
            "date": current_date,
            "invested": 0.0,
            "value": 0.0,
            "profit": 0.0,
            "cash": 0.0,
            "income": 0.0,
        }

        # Kiekvienai platformai naudojamas naujausias įrašas iki einamos datos.
        # Taip vėliau turėsime teisingą bendrą istoriją ir skirtingomis dienomis
        # atnaujinamoms platformoms.
        for entries in histories.values():
            applicable = [
                entry for entry in entries if entry["date"] <= current_date
            ]
            if not applicable:
                continue

            entry = applicable[-1]
            aggregate["invested"] += entry["invested"]
            aggregate["value"] += entry["value"]
            aggregate["profit"] += entry["profit"]
            aggregate["cash"] += entry["cash"]
            aggregate["income"] += entry["income"]

        result.append({
            "date": aggregate["date"],
            "invested": rounded(aggregate["invested"]),
            "value": rounded(aggregate["value"]),
            "profit": rounded(aggregate["profit"]),
            "cash": rounded(aggregate["cash"]),
            "income": rounded(aggregate["income"]),
        })

    return result


def build_portfolio(
    platform_documents: list[dict[str, Any]],
) -> dict[str, Any]:
    cards = build_platform_cards(platform_documents)

    return {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": datetime.now().astimezone().isoformat(
            timespec="seconds"
        ),
        "currency": "EUR",
        "summary": build_summary(cards),
        "allocation": build_allocation(cards),
        "platforms": cards,
        "history": build_history(platform_documents),
    }


def write_json(data: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = output_path.with_suffix(output_path.suffix + ".tmp")

    with temporary.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")

    temporary.replace(output_path)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sujungia platformų JSON į Portfolio V2 portfolio.json."
    )
    parser.add_argument(
        "--input-dir",
        default=str(DEFAULT_INPUT_DIR),
        help="Platformų JSON katalogas.",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Generuojamas portfolio.json.",
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()

    try:
        platform_documents = load_platforms(input_dir)
        portfolio = build_portfolio(platform_documents)
        write_json(portfolio, output_path)
    except (
        OSError,
        json.JSONDecodeError,
        TypeError,
        ValueError,
    ) as error:
        print(f"\nKLAIDA: {error}\n")
        return 1

    summary = portfolio["summary"]

    print("\nPORTFOLIO V2 SUKURTAS")
    print("=====================")
    print(f"Platformų: {summary['platformCount']}")
    print(f"Investuota: {summary['invested']:.2f} EUR")
    print(f"Vertė: {summary['currentValue']:.2f} EUR")
    print(f"Pelnas: {summary['profit']:.2f} EUR")
    if summary["returnRate"] is not None:
        print(f"Grąža: {summary['returnRate']:.2f} %")
    print(f"Aktyvių investicijų: {summary['activeInvestments']}")
    print(f"Vėluojančių: {summary['delayedInvestments']}")
    print(f"Užbaigtų: {summary['completedInvestments']}")
    print(f"JSON: {output_path}")
    print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
