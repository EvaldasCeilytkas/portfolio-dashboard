from __future__ import annotations

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable

JOBS = (
    (
        "Rima – Revolut Brokerage",
        PROJECT_ROOT / "scripts" / "import_revolut_brokerage.py",
        PROJECT_ROOT / "excel" / "Revolut Brokerage Rima.xlsx",
        PROJECT_ROOT / "public" / "data" / "rima" / "platforms" / "revolut-brokerage.json",
    ),
    (
        "Rima – SEB Fondai",
        PROJECT_ROOT / "scripts" / "import_seb_fondai.py",
        PROJECT_ROOT / "excel" / "SEB Fondai Rima.xlsx",
        PROJECT_ROOT / "public" / "data" / "rima" / "platforms" / "seb-fondai.json",
    ),
    (
        "Rima – Lendermarket",
        PROJECT_ROOT / "scripts" / "import_lendermarket.py",
        PROJECT_ROOT / "excel" / "Lendermarket Rima.xlsx",
        PROJECT_ROOT / "public" / "data" / "rima" / "platforms" / "lendermarket.json",
    ),
    (
        "Rima – Debitum",
        PROJECT_ROOT / "scripts" / "import_debitum.py",
        PROJECT_ROOT / "excel" / "Debitum Rima.xlsx",
        PROJECT_ROOT / "public" / "data" / "rima" / "platforms" / "debitum.json",
    ),
    (
        "Rima – Scramble",
        PROJECT_ROOT / "scripts" / "import_scramble.py",
        PROJECT_ROOT / "excel" / "Scramble Rima.xlsx",
        PROJECT_ROOT / "public" / "data" / "rima" / "platforms" / "scramble.json",
    ),
    (
        "Rima – Profitus",
        PROJECT_ROOT / "scripts" / "import_profitus.py",
        PROJECT_ROOT / "excel" / "Profitus Rima.xlsx",
        PROJECT_ROOT / "public" / "data" / "rima" / "platforms" / "profitus.json",
    ),
    (
        "Rima – Nordstreet",
        PROJECT_ROOT / "scripts" / "import_nordstreet.py",
        PROJECT_ROOT / "excel" / "Nordstreet Rima.xlsx",
        PROJECT_ROOT / "public" / "data" / "rima" / "platforms" / "nordstreet.json",
    ),
    (
        "Rima – Indemo",
        PROJECT_ROOT / "scripts" / "import_indemo.py",
        PROJECT_ROOT / "excel" / "Indemo Rima.xlsx",
        PROJECT_ROOT / "public" / "data" / "rima" / "platforms" / "indemo.json",
    ),
)


def main() -> int:
    print("=" * 68)
    print("RIMOS PORTFELIO ATNAUJINIMAS V1.4")
    print("=" * 68)

    missing = [str(source) for _, _, source, _ in JOBS if not source.is_file()]
    if missing:
        print("KLAIDA: nerasti Excel failai:")
        for path in missing:
            print(f"  - {path}")
        return 1

    for title, importer, source, output in JOBS:
        print(f"\n--- {title} ---")
        result = subprocess.run(
            [PYTHON, str(importer), "--input", str(source), "--output", str(output)],
            cwd=PROJECT_ROOT,
        )
        if result.returncode != 0:
            print(f"KLAIDA: nepavyko atnaujinti „{title}“.")
            return result.returncode


    print("\n--- Rima – platformų istoriniai grafikai ---")
    history_source = PROJECT_ROOT / "excel" / "Investavimas Rima.xlsx"
    history_output = PROJECT_ROOT / "public" / "data" / "rima" / "platform_history.json"
    history_script = PROJECT_ROOT / "scripts" / "generate_platform_history.py"

    if not history_source.is_file():
        print(f"KLAIDA: nerastas istorinis Excel failas: {history_source}")
        return 1

    result = subprocess.run(
        [PYTHON, str(history_script), str(history_source), str(history_output)],
        cwd=PROJECT_ROOT,
    )
    if result.returncode != 0:
        print("KLAIDA: nepavyko sugeneruoti Rimos platformų istorijos.")
        return result.returncode

    print("\nRimos fondų, ETF, P2P, NT ir istorinių grafikų duomenys atnaujinti sėkmingai.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
