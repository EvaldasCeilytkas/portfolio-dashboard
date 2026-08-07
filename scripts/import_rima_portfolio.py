from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable
REGISTRY_FILE = PROJECT_ROOT / "src" / "data" / "platforms.json"
OWNER_ID = "rima"
OWNER_NAME = "Rima"
OUTPUT_DIR = PROJECT_ROOT / "public" / "data" / OWNER_ID / "platforms"


def load_registry() -> list[dict[str, Any]]:
    if not REGISTRY_FILE.is_file():
        raise FileNotFoundError(f"Nerastas platformų registras: {REGISTRY_FILE}")

    with REGISTRY_FILE.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    if not isinstance(payload, list):
        raise ValueError("platforms.json turi būti JSON masyvas.")

    return payload


def owner_jobs(registry: list[dict[str, Any]]) -> list[tuple[str, Path, Path, Path]]:
    jobs: list[tuple[str, Path, Path, Path]] = []

    for platform in registry:
        if platform.get("enabled", True) is False:
            continue

        owners = platform.get("owners") or ["evaldas"]
        if OWNER_ID not in owners:
            continue

        slug = str(platform.get("slug") or "").strip()
        name = str(platform.get("name") or slug).strip()
        importer_name = str(platform.get("importer") or "").strip()
        owner_sources = platform.get("ownerSources") or {}
        source_name = str(owner_sources.get(OWNER_ID) or "").strip()

        # Į ownerio automatinį importą patenka tik platformos,
        # kurioms registre aiškiai nurodytas Excel šaltinis.
        if not source_name:
            continue

        if not slug or not importer_name:
            raise ValueError(
                f"Platformai „{name or '?'}“ trūksta slug arba importer lauko."
            )

        jobs.append(
            (
                f"{OWNER_NAME} – {name}",
                PROJECT_ROOT / "scripts" / importer_name,
                PROJECT_ROOT / "excel" / source_name,
                OUTPUT_DIR / f"{slug}.json",
            )
        )

    return jobs


def run_job(title: str, importer: Path, source: Path, output: Path) -> int:
    print(f"\n--- {title} ---")

    if not importer.is_file():
        print(f"KLAIDA: nerastas importeris: {importer}")
        return 1

    if not source.is_file():
        print(f"KLAIDA: nerastas Excel failas: {source}")
        return 1

    output.parent.mkdir(parents=True, exist_ok=True)

    result = subprocess.run(
        [
            PYTHON,
            str(importer),
            "--input",
            str(source),
            "--output",
            str(output),
        ],
        cwd=PROJECT_ROOT,
    )

    if result.returncode != 0:
        print(f"KLAIDA: nepavyko atnaujinti „{title}“.")

    return result.returncode


def generate_platform_history() -> int:
    print("\n--- Rima – platformų istoriniai grafikai ---")
    source = PROJECT_ROOT / "excel" / "Investavimas Rima.xlsx"
    output = PROJECT_ROOT / "public" / "data" / OWNER_ID / "platform_history.json"
    script = PROJECT_ROOT / "scripts" / "generate_platform_history.py"

    if not source.is_file():
        print(f"KLAIDA: nerastas istorinis Excel failas: {source}")
        return 1

    if not script.is_file():
        print(f"KLAIDA: nerastas istorijos generatorius: {script}")
        return 1

    result = subprocess.run(
        [PYTHON, str(script), str(source), str(output)],
        cwd=PROJECT_ROOT,
    )

    if result.returncode != 0:
        print("KLAIDA: nepavyko sugeneruoti Rimos platformų istorijos.")

    return result.returncode


def main() -> int:
    print("=" * 68)
    print("RIMOS PORTFELIO ATNAUJINIMAS V2.5.4 – AUTO PLATFORM ENGINE")
    print("=" * 68)
    print(f"Registras: {REGISTRY_FILE}")

    try:
        registry = load_registry()
        jobs = owner_jobs(registry)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"KLAIDA: {error}")
        return 1

    if not jobs:
        print("KLAIDA: registre nerasta nė viena Rimos platforma su ownerSources.rima.")
        return 1

    print(f"Rasta platformų: {len(jobs)}")

    missing = [
        str(path)
        for _, importer, source, _ in jobs
        for path in (importer, source)
        if not path.is_file()
    ]
    if missing:
        print("KLAIDA: nerasti reikalingi failai:")
        for path in missing:
            print(f"  - {path}")
        return 1

    for title, importer, source, output in jobs:
        result = run_job(title, importer, source, output)
        if result != 0:
            return result

    result = generate_platform_history()
    if result != 0:
        return result

    print(
        "\nRimos fondų, ETF, P2P, NT ir istorinių grafikų duomenys "
        "atnaujinti sėkmingai."
    )
    print("Auto Platform Engine: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
