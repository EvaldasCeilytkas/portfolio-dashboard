from __future__ import annotations
from common.excel_paths import excel_path, excel_glob

import argparse
import sys
from pathlib import Path

from import_income import load_income, write_json


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    default_input = excel_path(root / 'excel' / 'Income Rima.xlsx')
    safe_output = root / 'public' / 'data' / 'rima' / 'platforms' / 'income.json'

    parser = argparse.ArgumentParser(description='Tik Rimos Income Excel importas')
    parser.add_argument('--input', default=str(default_input))
    parser.add_argument('--output', default=str(safe_output))
    args = parser.parse_args()

    source = excel_path(Path(args.input).expanduser()).resolve()
    output = Path(args.output).expanduser().resolve()
    if output != safe_output.resolve():
        parser.error(f'Saugumo sumetimais leidziama rasyti tik i: {safe_output}')
    if source.name.casefold() not in {'income rima.xlsx', 'income rima.xlsm'}:
        parser.error('Rimos importeriui leidziamas tik Income Rima.xlsx arba Income Rima.xlsm failas.')
    if not source.is_file():
        parser.error(f'Nerastas Excel failas: {source}')

    data = load_income(source)
    data['owner'] = 'rima'
    write_json(output, data)
    summary = data['summary']
    print(f"Rimos Income importas sekmingas: {summary['totalInvestments']} paskolos")
    print(f"Investuota: {summary['invested']:.2f} EUR; verte: {summary['currentValue']:.2f} EUR")
    print(f'JSON: {output}')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f'KLAIDA: {exc}', file=sys.stderr)
        raise SystemExit(1)
