from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = PROJECT_ROOT / "schemas" / "platform.schema.json"


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def validate_without_jsonschema(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    required_root = {
        "schemaVersion",
        "generatedAt",
        "platform",
        "summary",
        "history",
        "investments",
    }

    missing_root = required_root - data.keys()
    if missing_root:
        errors.append(
            "Trūksta pagrindinių laukų: " + ", ".join(sorted(missing_root))
        )

    if data.get("schemaVersion") != 1:
        errors.append("schemaVersion turi būti 1")

    platform = data.get("platform")
    if not isinstance(platform, dict):
        errors.append("platform turi būti objektas")
    else:
        required_platform = {
            "id",
            "slug",
            "name",
            "group",
            "type",
            "category",
            "currency",
            "active",
            "startDate",
            "updatedAt",
            "website",
        }
        missing = required_platform - platform.keys()
        if missing:
            errors.append(
                "platform bloke trūksta: " + ", ".join(sorted(missing))
            )

        if platform.get("id") != platform.get("slug"):
            errors.append("platform.id turi sutapti su platform.slug")

        if platform.get("currency") != "EUR":
            errors.append("platform.currency turi būti EUR")

    summary = data.get("summary")
    if not isinstance(summary, dict):
        errors.append("summary turi būti objektas")

    history = data.get("history")
    if not isinstance(history, list):
        errors.append("history turi būti masyvas")

    investments = data.get("investments")
    if not isinstance(investments, list):
        errors.append("investments turi būti masyvas")
    else:
        codes: list[str] = []

        for index, investment in enumerate(investments):
            if not isinstance(investment, dict):
                errors.append(f"investments[{index}] turi būti objektas")
                continue

            required = {
                "id",
                "code",
                "name",
                "investmentType",
                "status",
                "currency",
                "invested",
                "currentValue",
                "profit",
                "investmentDate",
            }
            missing = required - investment.keys()
            if missing:
                errors.append(
                    f"investments[{index}] trūksta: "
                    + ", ".join(sorted(missing))
                )

            code = investment.get("code")
            if isinstance(code, str):
                codes.append(code)

            if investment.get("id") != code:
                errors.append(
                    f"investments[{index}]: id turi sutapti su code"
                )

            if investment.get("currency") != "EUR":
                errors.append(
                    f"investments[{index}]: currency turi būti EUR"
                )

        duplicate_codes = sorted(
            code for code in set(codes) if codes.count(code) > 1
        )
        if duplicate_codes:
            errors.append(
                "Dubliuoti investment code: " + ", ".join(duplicate_codes)
            )

    return errors


def validate_with_jsonschema(
    data: dict[str, Any],
    schema: dict[str, Any],
) -> list[str]:
    try:
        from jsonschema import Draft202012Validator
        from jsonschema import FormatChecker
    except ImportError:
        return validate_without_jsonschema(data)

    validator = Draft202012Validator(
        schema,
        format_checker=FormatChecker(),
    )

    return [
        f"{'/'.join(str(part) for part in error.absolute_path) or 'root'}: "
        f"{error.message}"
        for error in sorted(
            validator.iter_errors(data),
            key=lambda error: list(error.absolute_path),
        )
    ]


def main() -> int:
    if len(sys.argv) != 2:
        print(
            "Naudojimas: python scripts/validate_platform_data.py "
            "<platformos-json-failas>"
        )
        return 1

    data_path = Path(sys.argv[1]).resolve()

    if not data_path.exists():
        print(f"Failas nerastas: {data_path}")
        return 1

    schema = load_json(SCHEMA_PATH)
    data = load_json(data_path)

    if not isinstance(data, dict):
        print("Platformos JSON šaknis turi būti objektas.")
        return 1

    errors = validate_with_jsonschema(data, schema)

    print("")
    print(f"Tikrinamas failas: {data_path.name}")
    print("")

    if errors:
        print("PLATFORMOS JSON PATIKRA: KLAIDOS")
        print("================================")
        for error in errors:
            print(f"- {error}")
        print("")
        return 1

    platform_name = data["platform"]["name"]
    investments_count = len(data["investments"])

    print("PLATFORMOS JSON PATIKRA: GERAI")
    print("==============================")
    print(f"Platforma: {platform_name}")
    print(f"Investicijų: {investments_count}")
    print(f"Schema: {data['schemaVersion']}")
    print("")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
