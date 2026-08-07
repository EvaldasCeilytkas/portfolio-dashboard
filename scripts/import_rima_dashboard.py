from __future__ import annotations

import json
import sys
from datetime import date, datetime
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.utils.datetime import from_excel


PROJECT_ROOT = Path(__file__).resolve().parents[1]
EXCEL_FILE = PROJECT_ROOT / "excel" / "Investavimas Rima.xlsx"
OUTPUT_DIR = PROJECT_ROOT / "public" / "data" / "rima"


def as_number(value, default: float = 0.0) -> float:
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return float(value)
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace(",", ".").strip())
    except (TypeError, ValueError):
        return default


def as_date(value, epoch) -> str:
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()

    # Leidžia nuskaityti tikras Excel datų serijines reikšmes,
    # bet neinterpretuoja 0 kaip datos.
    if isinstance(value, (int, float)) and value > 0:
        converted = from_excel(value, epoch)
        if isinstance(converted, datetime):
            return converted.date().isoformat()
        if isinstance(converted, date):
            return converted.isoformat()

    if isinstance(value, str):
        text = value.strip()
        if not text:
            raise ValueError("Tuščia data")
        for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%d.%m.%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(text, fmt).date().isoformat()
            except ValueError:
                pass

    raise ValueError(f"Neatpažinta data: {value!r}")


def find_section_start(ws, title: str) -> int:
    """Randa suvestinės bloko pradžios stulpelį pagal 1 eilutės antraštę."""
    wanted = title.strip().casefold()

    for cell in ws[1]:
        value = cell.value
        if isinstance(value, str) and value.strip().casefold() == wanted:
            # Patikriname, kad po antrašte tikrai yra 'Data'.
            second_row = ws.cell(row=2, column=cell.column).value
            if isinstance(second_row, str) and second_row.strip().casefold() == "data":
                return cell.column

    raise ValueError(f"Nerastas suvestinės blokas „{title}“.")


def read_history(ws, title: str, epoch) -> list[dict]:
    start_col = find_section_start(ws, title)

    # Bloko struktūra:
    # Data | Įnešta | Per mėn. | Vertė | Prieaugis | % | Per mėn.
    date_col = start_col
    invested_col = start_col + 1
    monthly_contribution_col = start_col + 2
    value_col = start_col + 3
    profit_col = start_col + 4
    return_rate_col = start_col + 5
    monthly_result_col = start_col + 6

    history: list[dict] = []

    for row in range(3, ws.max_row + 1):
        raw_date = ws.cell(row=row, column=date_col).value

        if raw_date in (None, ""):
            continue

        period = as_date(raw_date, epoch)
        invested = as_number(ws.cell(row=row, column=invested_col).value)
        monthly_contribution = as_number(
            ws.cell(row=row, column=monthly_contribution_col).value
        )
        value = as_number(ws.cell(row=row, column=value_col).value)
        profit = as_number(ws.cell(row=row, column=profit_col).value)
        rate_raw = as_number(ws.cell(row=row, column=return_rate_col).value)
        monthly_result = as_number(ws.cell(row=row, column=monthly_result_col).value)

        # Excel faile procentas saugomas kaip 0.0789, dashboardas tikisi 7.89.
        return_rate = rate_raw * 100.0

        history.append(
            {
                "date": period,
                "invested": round(invested, 2),
                "monthlyContribution": round(monthly_contribution, 2),
                "value": round(value, 2),
                "profit": round(profit, 2),
                "returnRate": round(return_rate, 4),
                "monthlyResult": round(monthly_result, 2),
            }
        )

    history.sort(key=lambda item: item["date"])
    return history


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")
    temp.replace(path)


def print_result(label: str, history: list[dict]) -> None:
    if not history:
        print(f"[WARN] {label}: istorijos nėra.")
        return
    latest = history[-1]
    print(
        f"[OK] {label}: {len(history)} mėn. "
        f"{latest['date']}, {latest['value']:.2f} €"
    )


def main() -> int:
    print("=" * 66)
    print("RIMOS DASHBOARD IMPORTERIS V1.1")
    print("=" * 66)
    print(f"Excel:    {EXCEL_FILE}")
    print(f"Išvestis: {OUTPUT_DIR}")

    if not EXCEL_FILE.is_file():
        print(f"KLAIDA: nerastas Excel failas: {EXCEL_FILE}")
        return 1

    workbook = load_workbook(EXCEL_FILE, data_only=True, read_only=False)

    try:
        if "Investavimas" not in workbook.sheetnames:
            raise ValueError("Excel faile nerastas lapas „Investavimas“.")

        ws = workbook["Investavimas"]

        funds_history = read_history(ws, "Fondai", workbook.epoch)
        p2p_history = read_history(ws, "P2P", workbook.epoch)
        portfolio_history = read_history(ws, "Viso", workbook.epoch)

        write_json(OUTPUT_DIR / "funds_history.json", funds_history)
        write_json(OUTPUT_DIR / "p2p_history.json", p2p_history)
        write_json(OUTPUT_DIR / "portfolio_history.json", portfolio_history)

        print_result("Fondai", funds_history)
        print_result("P2P", p2p_history)
        print_result("Visas portfelis", portfolio_history)

        print()
        print("Rimos Dashboard duomenys atnaujinti sėkmingai.")
        return 0

    finally:
        workbook.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"KLAIDA: {error}", file=sys.stderr)
        raise SystemExit(1)
