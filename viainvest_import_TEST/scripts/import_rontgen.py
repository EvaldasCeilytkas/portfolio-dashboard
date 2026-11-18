from __future__ import annotations
import sys
from common import PlatformConfig, run_import

CONFIG = PlatformConfig(
    slug="rontgen", name="Rontgen", website="https://rontgen.lt", excel_name="Rontgen",
    overview_sheet="Overview", payment_style="rontgen",
    completion_requires_date=True, nordstreet_codes=False,
    maturity_labels=("Paskolos pabaiga",), paid_row_is_settled=False,
)

if __name__ == "__main__":
    try:
        raise SystemExit(run_import(CONFIG))
    except Exception as error:
        print(f"\nKLAIDA: {error}\n", file=sys.stderr)
        raise SystemExit(1)
