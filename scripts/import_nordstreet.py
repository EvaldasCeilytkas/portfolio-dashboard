from __future__ import annotations
import sys
from common import PlatformConfig, run_import

CONFIG = PlatformConfig(
    slug="nordstreet", name="Nordstreet", website="https://nordstreet.com", excel_name="Nordstreet",
    overview_sheet="Apžvalga", payment_style="nordstreet",
    completion_requires_date=True, nordstreet_codes=True,
    maturity_labels=("Investicijos pabaiga", "Paskolos pabaiga"), paid_row_is_settled=True,
)

if __name__ == "__main__":
    try:
        raise SystemExit(run_import(CONFIG))
    except Exception as error:
        print(f"\nKLAIDA: {error}\n", file=sys.stderr)
        raise SystemExit(1)
