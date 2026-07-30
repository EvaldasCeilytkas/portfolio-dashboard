from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from scripts.common.broker_importer import BrokerImporter
from scripts.common.excel import (
    get_instrument_sheet_names,
    get_month_sheet_names,
    require_sheet,
)
from scripts.common.utils import (
    EPSILON,
    find_month_rows,
    finite_number,
    month_end,
    month_start,
    rounded,
    slugify,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class SynergyImporter(BrokerImporter):
    PLATFORM_ID = "synergy"
    PLATFORM_NAME = "Synergy"
    PLATFORM_GROUP = "funds"
    PLATFORM_TYPE = "funds"
    PLATFORM_CATEGORY = "Investiciniai fondai"
    WEBSITE = None

    DEFAULT_INPUT = PROJECT_ROOT / "excel" / "Synergy.xlsx"
    DEFAULT_OUTPUT = (
        PROJECT_ROOT
        / "public"
        / "data"
        / "platforms"
        / "synergy.json"
    )

    OVERVIEW_SHEET = "Apžvalga"

    def read_history(self) -> list[dict[str, Any]]:
        ws = require_sheet(
            self.workbook,
            self.OVERVIEW_SHEET,
        )

        rows = find_month_rows(ws, start_row=2)
        if not rows:
            raise ValueError(
                "Apžvalgos lape nerasta mėnesinių duomenų."
            )

        history: list[dict[str, Any]] = []
        previous_contributed = 0.0

        for row in rows:
            period = month_start(ws.cell(row, 1).value)
            contributed = finite_number(ws.cell(row, 2).value)
            net_invested = finite_number(ws.cell(row, 3).value)
            current_value = finite_number(ws.cell(row, 6).value)
            profit = finite_number(ws.cell(row, 7).value)
            return_raw = ws.cell(row, 8).value
            fees = finite_number(ws.cell(row, 9).value)

            history.append({
                "date": period,
                "month": period[:7],
                "invested": rounded(contributed),
                "netInvested": rounded(net_invested),
                "currentValue": rounded(current_value),
                "profit": rounded(profit),
                "returnRate": (
                    round(
                        finite_number(return_raw) * 100,
                        4,
                    )
                    if return_raw is not None
                    else None
                ),
                "cash": 0.0,
                "income": 0.0,
                "fees": rounded(fees),
                "contributions": rounded(
                    contributed - previous_contributed
                ),
                "withdrawals": 0.0,
                "activeInvestments": 0,
                "delayedInvestments": 0,
                "completedInvestments": 0,
            })

            previous_contributed = contributed

        return history

    def read_investments(self) -> list[dict[str, Any]]:
        excluded = {self.OVERVIEW_SHEET}
        sheet_names = get_instrument_sheet_names(
            self.workbook,
            excluded=excluded,
        )

        investments: list[dict[str, Any]] = []

        for sheet_name in sheet_names:
            ws = self.workbook[sheet_name]
            rows = find_month_rows(ws, start_row=2)

            if not rows:
                continue

            first_row = rows[0]
            last_row = rows[-1]

            ticker = str(ws["A1"].value or sheet_name).strip()
            quantity = finite_number(ws.cell(last_row, 7).value)
            price = finite_number(ws.cell(last_row, 8).value)
            current_value = finite_number(
                ws.cell(last_row, 9).value
            )
            total_contributed = finite_number(
                ws.cell(last_row, 3).value
            )
            total_invested = finite_number(
                ws.cell(last_row, 5).value
            )
            total_profit = finite_number(
                ws.cell(last_row, 12).value
            )
            return_raw = ws.cell(last_row, 11).value

            is_active = (
                quantity > EPSILON
                and current_value > EPSILON
            )

            investments.append({
                "id": slugify(sheet_name),
                "slug": slugify(sheet_name),
                "ticker": ticker,
                "name": sheet_name,
                "fullName": sheet_name,
                "type": "fund",
                "status": (
                    "active" if is_active else "completed"
                ),
                "currency": "EUR",
                "startDate": month_start(
                    ws.cell(first_row, 1).value
                ),
                "endDate": (
                    None
                    if is_active
                    else month_end(
                        ws.cell(last_row, 1).value
                    )
                ),
                "invested": rounded(total_contributed),
                "netInvested": rounded(
                    total_invested if is_active else 0.0
                ),
                "currentValue": rounded(
                    current_value if is_active else 0.0
                ),
                "profit": rounded(total_profit),
                "returnRate": (
                    round(
                        finite_number(return_raw) * 100,
                        4,
                    )
                    if return_raw is not None
                    else None
                ),
                "quantity": round(
                    quantity if is_active else 0.0,
                    8,
                ),
                "price": rounded(
                    price if is_active else 0.0,
                    6,
                ),
                "realizedProceeds": 0.0,
                "dividends": 0.0,
                "fees": rounded(
                    total_contributed - total_invested
                ),
            })

        investments.sort(
            key=lambda item: (
                -item["currentValue"],
                item["name"],
            )
        )

        return investments

    def build_document(self) -> dict[str, Any]:
        history = self.read_history()
        investments = self.read_investments()
        latest = history[-1]

        summary = self.create_summary(
            history=history,
            investments=investments,
            total_contributed=latest["invested"],
        )

        active = [
            item
            for item in investments
            if item["status"] == "active"
        ]

        latest["activeInvestments"] = (
            summary["activeInvestments"]
        )
        latest["completedInvestments"] = (
            summary["completedInvestments"]
        )

        return {
            "schemaVersion": self.SCHEMA_VERSION,
            "generatedAt": (
                datetime.now()
                .astimezone()
                .isoformat(timespec="seconds")
            ),
            "platform": {
                "id": self.PLATFORM_ID,
                "slug": self.PLATFORM_ID,
                "name": self.PLATFORM_NAME,
                "group": self.PLATFORM_GROUP,
                "type": self.PLATFORM_TYPE,
                "category": self.PLATFORM_CATEGORY,
                "currency": self.CURRENCY,
                "active": bool(active),
                "startDate": history[0]["date"],
                "updatedAt": month_end(
                    history[-1]["month"]
                ),
                "website": self.WEBSITE,
            },
            "summary": summary,
            "history": history,
            "investments": investments,
            "distributions": self.create_distributions(
                investments
            ),
            "latestMonth": latest,
            "largestInvestment": (
                {
                    "id": active[0]["id"],
                    "ticker": active[0]["ticker"],
                    "name": active[0]["name"],
                    "currentValue": (
                        active[0]["currentValue"]
                    ),
                }
                if active
                else None
            ),
            "source": {
                "file": self.input_path.name,
                "overviewSheet": self.OVERVIEW_SHEET,
                "instrumentSheets": [
                    item["name"]
                    for item in investments
                ],
                "monthlySheets": get_month_sheet_names(
                    self.workbook
                ),
            },
        }


IMPORTER_CLASS = SynergyImporter


if __name__ == "__main__":
    SynergyImporter.main()
