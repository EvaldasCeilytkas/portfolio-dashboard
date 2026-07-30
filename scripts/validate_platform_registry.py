from __future__ import annotations

from collections import Counter
from typing import Any

from platform_registry import load_platforms

REQUIRED_FIELDS = {
    "id",
    "slug",
    "name",
    "group",
    "type",
    "category",
    "currency",
    "enabled",
    "importer",
    "dataFile",
    "supportsHistory",
    "supportsProjects",
    "supportsCash",
    "logo",
    "website",
}

ALLOWED_GROUPS = {"funds", "brokerage", "robo", "p2p", "real_estate"}
ALLOWED_TYPES = {"fund", "broker", "robo", "p2p", "real_estate", "npl"}


def find_duplicates(values: list[str]) -> list[str]:
    counts = Counter(values)
    return sorted(value for value, count in counts.items() if count > 1)


def validate_platform(platform: dict[str, Any], index: int) -> list[str]:
    errors: list[str] = []
    prefix = f"platform[{index}]"

    missing = REQUIRED_FIELDS - platform.keys()
    if missing:
        errors.append(f"{prefix}: trūksta laukų: {', '.join(sorted(missing))}")

    slug = platform.get("slug")
    if not isinstance(slug, str) or not slug:
        errors.append(f"{prefix}: neteisingas slug")
    elif slug != slug.lower() or " " in slug:
        errors.append(f"{prefix}: slug turi būti mažosiomis raidėmis ir be tarpų")

    if platform.get("id") != slug:
        errors.append(f"{prefix}: id turi sutapti su slug")

    if platform.get("group") not in ALLOWED_GROUPS:
        errors.append(f"{prefix}: neleistina group reikšmė")

    if platform.get("type") not in ALLOWED_TYPES:
        errors.append(f"{prefix}: neleistina type reikšmė")

    if platform.get("currency") != "EUR":
        errors.append(f"{prefix}: V2 pradžioje palaikoma tik EUR")

    data_file = platform.get("dataFile")
    expected_data_file = f"/data/platforms/{slug}.json"
    if data_file != expected_data_file:
        errors.append(
            f"{prefix}: dataFile turi būti {expected_data_file}"
        )

    importer = platform.get("importer")
    expected_importer = f"import_{slug.replace('-', '_')}.py"
    if importer != expected_importer:
        errors.append(
            f"{prefix}: importer turi būti {expected_importer}"
        )

    for field in ("enabled", "supportsHistory", "supportsProjects", "supportsCash"):
        if not isinstance(platform.get(field), bool):
            errors.append(f"{prefix}: {field} turi būti true arba false")

    return errors


def main() -> int:
    platforms = load_platforms()
    errors: list[str] = []

    if not platforms:
        errors.append("Registras tuščias.")

    for index, platform in enumerate(platforms):
        if not isinstance(platform, dict):
            errors.append(f"platform[{index}] nėra objektas")
            continue
        errors.extend(validate_platform(platform, index))

    slugs = [
        platform.get("slug")
        for platform in platforms
        if isinstance(platform, dict) and isinstance(platform.get("slug"), str)
    ]
    ids = [
        platform.get("id")
        for platform in platforms
        if isinstance(platform, dict) and isinstance(platform.get("id"), str)
    ]

    duplicate_slugs = find_duplicates(slugs)
    duplicate_ids = find_duplicates(ids)

    if duplicate_slugs:
        errors.append(f"Dubliuoti slug: {', '.join(duplicate_slugs)}")
    if duplicate_ids:
        errors.append(f"Dubliuoti id: {', '.join(duplicate_ids)}")

    if errors:
        print("")
        print("PLATFORMŲ REGISTRO PATIKRA: KLAIDOS")
        print("=================================")
        for error in errors:
            print(f"- {error}")
        print("")
        return 1

    print("")
    print("PLATFORMŲ REGISTRO PATIKRA: GERAI")
    print("================================")
    print(f"Platformų: {len(platforms)}")
    print(f"Aktyvių: {sum(1 for platform in platforms if platform['enabled'])}")
    print("")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
