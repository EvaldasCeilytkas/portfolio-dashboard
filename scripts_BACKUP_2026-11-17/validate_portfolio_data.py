from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_ROOT / "public" / "data" / "portfolio.json"

ROOT_KEYS = {
    "schemaVersion",
    "generatedAt",
    "currency",
    "summary",
    "allocation",
    "platforms",
    "history",
}

SUMMARY_KEYS = {
    "invested",
    "currentValue",
    "profit",
    "returnRate",
    "xirr",
    "cash",
    "incomeReceived",
    "platformCount",
    "activeInvestments",
    "delayedInvestments",
    "completedInvestments",
}


def is_number(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(float(value))
    )


def require_number(container: dict[str, Any], key: str) -> None:
    if not is_number(container.get(key)):
        raise ValueError(f"Laukas '{key}' turi būti baigtinis skaičius.")


def validate(data: Any) -> None:
    if not isinstance(data, dict):
        raise ValueError("JSON šaknis turi būti objektas.")

    missing = ROOT_KEYS - set(data)
    if missing:
        raise ValueError(
            "Trūksta pagrindinių laukų: " + ", ".join(sorted(missing))
        )

    if data["schemaVersion"] != 1:
        raise ValueError("schemaVersion turi būti 1.")
    if data["currency"] != "EUR":
        raise ValueError("currency turi būti EUR.")

    summary = data["summary"]
    if not isinstance(summary, dict):
        raise ValueError("summary turi būti objektas.")

    missing_summary = SUMMARY_KEYS - set(summary)
    if missing_summary:
        raise ValueError(
            "summary trūksta laukų: "
            + ", ".join(sorted(missing_summary))
        )

    for key in (
        "invested",
        "currentValue",
        "profit",
        "cash",
        "incomeReceived",
    ):
        require_number(summary, key)

    for key in (
        "platformCount",
        "activeInvestments",
        "delayedInvestments",
        "completedInvestments",
    ):
        value = summary.get(key)
        if not isinstance(value, int) or isinstance(value, bool) or value < 0:
            raise ValueError(f"summary.{key} turi būti neneigiamas sveikasis.")

    for key in ("returnRate", "xirr"):
        value = summary.get(key)
        if value is not None and not is_number(value):
            raise ValueError(f"summary.{key} turi būti skaičius arba null.")

    platforms = data["platforms"]
    if not isinstance(platforms, list):
        raise ValueError("platforms turi būti masyvas.")
    if len(platforms) != summary["platformCount"]:
        raise ValueError(
            "summary.platformCount nesutampa su platforms masyvo dydžiu."
        )

    slugs: set[str] = set()
    for platform in platforms:
        if not isinstance(platform, dict):
            raise ValueError("Kiekviena platforma turi būti objektas.")
        slug = str(platform.get("slug") or "").strip()
        if not slug:
            raise ValueError("Platformai trūksta slug.")
        if slug in slugs:
            raise ValueError(f"Dubliuota platforma: {slug}")
        slugs.add(slug)
        if not isinstance(platform.get("summary"), dict):
            raise ValueError(f"{slug}: trūksta platformos summary.")

    allocation = data["allocation"]
    if not isinstance(allocation, list):
        raise ValueError("allocation turi būti masyvas.")

    allocation_value = 0.0
    for item in allocation:
        if not isinstance(item, dict):
            raise ValueError("allocation įrašas turi būti objektas.")
        require_number(item, "currentValue")
        require_number(item, "percentage")
        allocation_value += float(item["currentValue"])

    if abs(allocation_value - float(summary["currentValue"])) > 0.05:
        raise ValueError(
            "allocation suma nesutampa su summary.currentValue."
        )

    history = data["history"]
    if not isinstance(history, list):
        raise ValueError("history turi būti masyvas.")

    previous_date = ""
    for entry in history:
        if not isinstance(entry, dict) or not entry.get("date"):
            raise ValueError("Netinkamas history įrašas.")
        current_date = str(entry["date"])
        if previous_date and current_date < previous_date:
            raise ValueError("history datos nėra surūšiuotos.")
        previous_date = current_date


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Patikrina Portfolio V2 portfolio.json."
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=str(DEFAULT_INPUT),
        help="Tikrinamas portfolio.json failas.",
    )
    args = parser.parse_args()
    path = Path(args.path).expanduser().resolve()

    try:
        with path.open("r", encoding="utf-8-sig") as file:
            data = json.load(file)
        validate(data)
    except (OSError, json.JSONDecodeError, TypeError, ValueError) as error:
        print(f"\nPORTFOLIO JSON PATIKRA: KLAIDA\n{error}\n")
        return 1

    print("\nPORTFOLIO JSON PATIKRA: GERAI")
    print("============================")
    print(f"Platformų: {data['summary']['platformCount']}")
    print(f"Vertė: {data['summary']['currentValue']:.2f} EUR")
    print(f"Schema: {data['schemaVersion']}")
    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
