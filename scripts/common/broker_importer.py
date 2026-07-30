from __future__ import annotations

from abc import abstractmethod
from typing import Any

from .base_importer import BaseImporter
from .utils import EPSILON, finite_number, rounded


class BrokerImporter(BaseImporter):
    """
    Bendras brokerių, fondų ir robo-advisor importerių pagrindas.

    Konkretus importeris turi:
    1. perskaityti overview;
    2. perskaityti pozicijas;
    3. nustatyti aktyvumo / uždarymo būseną;
    4. grąžinti Portfolio V2 dokumentą.
    """

    @abstractmethod
    def read_history(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def read_investments(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    def is_portfolio_closed(
        self,
        history: list[dict[str, Any]],
        investments: list[dict[str, Any]],
    ) -> bool:
        return not any(
            item.get("status") == "active"
            for item in investments
        )

    def create_summary(
        self,
        *,
        history: list[dict[str, Any]],
        investments: list[dict[str, Any]],
        total_contributed: float,
        realized_profit: float | None = None,
        realized_proceeds: float | None = None,
    ) -> dict[str, Any]:
        latest = history[-1]

        active = [
            item
            for item in investments
            if item.get("status") == "active"
        ]
        completed = [
            item
            for item in investments
            if item.get("status") == "completed"
        ]

        closed = self.is_portfolio_closed(history, investments)

        if closed:
            invested = 0.0
            current_value = 0.0
            cash = 0.0
            profit = (
                rounded(realized_profit)
                if realized_profit is not None
                else rounded(latest.get("profit"))
            )
        else:
            invested = rounded(
                sum(
                    finite_number(item.get("netInvested"))
                    for item in active
                )
            )
            current_value = rounded(
                latest.get("currentValue")
            )
            cash = rounded(latest.get("cash"))
            profit = rounded(latest.get("profit"))

        return {
            "invested": invested,
            "netInvested": invested,
            "totalContributed": rounded(total_contributed),
            "currentValue": current_value,
            "profit": profit,
            "realizedProfit": rounded(
                realized_profit or 0.0
            ),
            "realizedProceeds": rounded(
                realized_proceeds or 0.0
            ),
            "returnRate": latest.get("returnRate"),
            "xirr": latest.get("xirr"),
            "cash": cash,
            "incomeReceived": rounded(
                sum(
                    finite_number(point.get("income"))
                    for point in history
                )
            ),
            "fees": rounded(
                sum(
                    finite_number(point.get("fees"))
                    for point in history
                )
            ),
            "activeInvestments": len(active),
            "delayedInvestments": 0,
            "completedInvestments": len(completed),
            "averageRate": None,
            "averageLtv": None,
            "totalInvestments": len(investments),
        }

    def create_distributions(
        self,
        investments: list[dict[str, Any]],
    ) -> dict[str, Any]:
        active = [
            item
            for item in investments
            if item.get("status") == "active"
        ]
        completed = [
            item
            for item in investments
            if item.get("status") == "completed"
        ]

        active_value = rounded(
            sum(
                finite_number(item.get("currentValue"))
                for item in active
            )
        )

        return {
            "status": [
                {
                    "key": "active",
                    "label": "Aktyvios",
                    "count": len(active),
                    "value": active_value,
                },
                {
                    "key": "completed",
                    "label": "Parduotos",
                    "count": len(completed),
                    "value": rounded(
                        sum(
                            finite_number(
                                item.get("realizedProceeds")
                            )
                            for item in completed
                        )
                    ),
                },
            ],
            "holdings": [
                {
                    "key": item.get("ticker") or item["id"],
                    "label": item.get("ticker") or item["id"],
                    "name": item.get("name"),
                    "value": rounded(item.get("currentValue")),
                    "weight": (
                        round(
                            finite_number(
                                item.get("currentValue")
                            )
                            / active_value
                            * 100,
                            4,
                        )
                        if active_value > EPSILON
                        else 0.0
                    ),
                }
                for item in active
            ],
        }
