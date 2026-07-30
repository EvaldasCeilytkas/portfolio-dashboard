from __future__ import annotations
import sys
from common import PlatformConfig, run_import

CONFIG = PlatformConfig(
    slug="crowdpear", name="Crowdpear", website="https://crowdpear.com", excel_name="Crowdpear",
    overview_sheet="Overview", payment_style="standard",
    completion_requires_date=False, nordstreet_codes=False,
    maturity_labels=("Paskolos pabaiga",), paid_row_is_settled=False,
)

if __name__ == "__main__":
    try:
        raise SystemExit(run_import(CONFIG))
    except Exception as error:
        print(f"\nKLAIDA: {error}\n", file=sys.stderr)
        raise SystemExit(1)
