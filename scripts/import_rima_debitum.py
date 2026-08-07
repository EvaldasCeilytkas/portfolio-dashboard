from __future__ import annotations

import sys
from pathlib import Path

from import_debitum import load_debitum, write_json


def main() -> int:
    scripts_dir = Path(__file__).resolve().parent
    project_root = scripts_dir.parent

    excel_file = project_root / "excel" / "Debitum Rima.xlsx"
    output_file = project_root / "public" / "data" / "rima" / "platforms" / "debitum.json"

    print("=" * 64)
    print("RIMA – DEBITUM IMPORTER V1")
    print("=" * 64)
    print(f"Excel failas: {excel_file}")

    if not excel_file.is_file():
        raise FileNotFoundError(f"Nerastas Rimos Debitum failas: {excel_file}")

    data = load_debitum(excel_file)
    write_json(output_file, data)

    summary = data["summary"]
    print(f"✅ Nuskaityta paskolų: {summary['totalInvestments']}")
    print(f"✅ Aktyvių: {summary['activeInvestments']}")
    print(f"✅ Vėluojančių: {summary['delayedInvestments']}")
    print(f"✅ Užbaigtų: {summary['completedInvestments']}")
    print(f"✅ Investuota: {summary['invested']:.2f} EUR")
    print(f"✅ Portfelio vertė: {summary['currentValue']:.2f} EUR")
    print(f"✅ Pelnas: {summary['profit']:.2f} EUR")
    print(f"✅ JSON sukurtas: {output_file}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"❌ KLAIDA: {error}", file=sys.stderr)
        raise SystemExit(1)
