from __future__ import annotations

from typing import Any

from .utils import EPSILON, finite_number, rounded


REQUIRED_PLATFORM_FIELDS = {
    "id",
    "slug",
    "name",
    "group",
    "type",
    "currency",
    "active",
    "startDate",
    "updatedAt",
}

REQUIRED_SUMMARY_FIELDS = {
    "invested",
    "totalContributed",
    "currentValue",
    "profit",
    "returnRate",
    "cash",
    "activeInvestments",
    "delayedInvestments",
    "completedInvestments",
    "totalInvestments",
}


def validate_platform_document(
    document: dict[str, Any],
) -> None:
    errors: list[str] = []

    platform = document.get("platform")
    summary = document.get("summary")
    history = document.get("history")
    investments = document.get("investments")

    if not isinstance(platform, dict):
        errors.append("Trūksta platform objekto.")
        platform = {}

    if not isinstance(summary, dict):
        errors.append("Trūksta summary objekto.")
        summary = {}

    if not isinstance(history, list) or not history:
        errors.append("History yra tuščias arba neteisingas.")

    if not isinstance(investments, list):
        errors.append("Investments turi būti sąrašas.")
        investments = []

    missing_platform = sorted(
        REQUIRED_PLATFORM_FIELDS - set(platform)
    )
    if missing_platform:
        errors.append(
            "Platform objekte trūksta laukų: "
            + ", ".join(missing_platform)
        )

    missing_summary = sorted(
        REQUIRED_SUMMARY_FIELDS - set(summary)
    )
    if missing_summary:
        errors.append(
            "Summary objekte trūksta laukų: "
            + ", ".join(missing_summary)
        )

    ids = [
        str(item.get("id"))
        for item in investments
        if isinstance(item, dict)
    ]
    if len(ids) != len(set(ids)):
        errors.append("Rasti dubliuoti investicijų ID.")

    active = [
        item
        for item in investments
        if isinstance(item, dict)
        and item.get("status") == "active"
    ]
    completed = [
        item
        for item in investments
        if isinstance(item, dict)
        and item.get("status") == "completed"
    ]

    if (
        finite_number(summary.get("activeInvestments"))
        != len(active)
    ):
        errors.append("Nesutampa aktyvių investicijų skaičius.")

    if (
        finite_number(summary.get("completedInvestments"))
        != len(completed)
    ):
        errors.append("Nesutampa užbaigtų investicijų skaičius.")

    if (
        finite_number(summary.get("totalInvestments"))
        != len(investments)
    ):
        errors.append("Nesutampa bendras investicijų skaičius.")

    active_value = rounded(
        sum(
            finite_number(item.get("currentValue"))
            for item in active
        )
    )
    cash = rounded(summary.get("cash"))

    # Kai portfelis aktyvus, aktyvių pozicijų vertė ir grynieji
    # turi paaiškinti dabartinę bendrą vertę.
    if platform.get("active"):
        expected_value = rounded(active_value + cash)
        actual_value = rounded(summary.get("currentValue"))

        if abs(expected_value - actual_value) > 0.05:
            errors.append(
                "Aktyvių pozicijų vertė ir grynieji "
                "nesutampa su currentValue: "
                f"{expected_value:.2f} != {actual_value:.2f}"
            )
    else:
        if abs(finite_number(summary.get("invested"))) > 0.01:
            errors.append(
                "Uždarytos platformos invested turi būti 0."
            )

        if abs(
            finite_number(summary.get("currentValue"))
        ) > 0.01:
            errors.append(
                "Uždarytos platformos currentValue turi būti 0."
            )

        if active:
            errors.append(
                "Uždaryta platforma negali turėti aktyvių pozicijų."
            )

    if errors:
        raise ValueError("\\n".join(errors))
