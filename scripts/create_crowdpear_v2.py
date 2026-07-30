from __future__ import annotations

import json
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]

SOURCE_CANDIDATES = [
    ROOT.parent / "portfolio-react" / "public" / "data" / "crowdpear.json",
    ROOT.parent / "portfolio-react" / "public" / "data" / "p2p" / "crowdpear.json",
    ROOT / "import" / "crowdpear-source.json",
]

OUTPUT_FILE = ROOT / "public" / "data" / "platforms" / "crowdpear.json"


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(f"JSON šaknis turi būti objektas: {path}")

    return data


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")

    with temporary.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")

    temporary.replace(path)


def number(value: Any, default: float = 0.0) -> float:
    if value is None or value == "":
        return default

    if isinstance(value, str):
        value = (
            value.replace("\u00a0", "")
            .replace("€", "")
            .replace("%", "")
            .replace(",", ".")
            .strip()
        )

    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return default


def nullable_number(value: Any) -> float | None:
    if value is None or value == "":
        return None
    return number(value)


def text(value: Any) -> str:
    return str(value or "").strip()


def nullable_text(value: Any) -> str | None:
    cleaned = text(value)
    return cleaned or None


def normalized_date(value: Any) -> str | None:
    cleaned = text(value)
    if not cleaned:
        return None

    # Senas Crowdpear JSON jau naudoja YYYY-MM-DD.
    return cleaned[:10]


def locate_source() -> Path:
    for candidate in SOURCE_CANDIDATES:
        if candidate.is_file():
            return candidate

    checked = "\n".join(f"  - {path}" for path in SOURCE_CANDIDATES)
    raise FileNotFoundError(
        "Nerastas senas Crowdpear JSON.\n"
        "Patikrintos vietos:\n"
        f"{checked}\n\n"
        "Jeigu senas projektas nėra šalia portfolio-v2, nukopijuokite "
        "crowdpear.json į portfolio-v2/import/crowdpear-source.json."
    )


def map_status(project: dict[str, Any]) -> str:
    old_status = text(project.get("status")).lower()
    outstanding = number(project.get("outstanding"))
    delay_days = int(number(
        project.get("delayDays", project.get("delayedDays", 0))
    ))

    if old_status in {"repaid", "completed", "closed"} or outstanding <= 0:
        return "completed"

    if old_status == "delayed" or delay_days > 0:
        return "delayed"

    return "active"


def map_payment_rows(project: dict[str, Any]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []

    for row in project.get("payments", []):
        if not isinstance(row, dict):
            continue

        actual_date = normalized_date(row.get("actualDate"))
        if not actual_date:
            continue

        principal = number(row.get("actualPrincipal"))
        interest = number(row.get("actualInterest"))
        extra = number(row.get("actualExtra"))

        if principal:
            result.append({
                "date": actual_date,
                "type": "principal",
                "amount": principal,
                "note": None,
            })

        if interest:
            result.append({
                "date": actual_date,
                "type": "interest",
                "amount": interest,
                "note": None,
            })

        if extra:
            result.append({
                "date": actual_date,
                "type": "other",
                "amount": extra,
                "note": "Papildoma išmoka",
            })

    result.sort(key=lambda payment: (payment["date"], payment["type"]))
    return result


def map_investment(project: dict[str, Any]) -> dict[str, Any]:
    code = text(
        project.get("loanCode")
        or project.get("code")
        or project.get("id")
    )

    if not code:
        raise ValueError(
            f"Projektas neturi kodo: {project.get('name', 'be pavadinimo')}"
        )

    invested = number(project.get("invested"))
    outstanding = number(project.get("outstanding"))
    interest_received = number(project.get("interestReceived"))
    extra_received = number(project.get("extraReceived"))
    status = map_status(project)

    return {
        "id": code,
        "code": code,
        "name": text(project.get("name")) or code,
        "investmentType": "real_estate_project",
        "status": status,
        "currency": "EUR",
        "invested": invested,
        # Aktyvios pozicijos vertė yra negrąžintas paskolos likutis.
        # Realizuotos palūkanos saugomos atskirai incomeReceived/profit.
        "currentValue": outstanding,
        "profit": round(interest_received + extra_received, 2),
        "investmentDate": normalized_date(project.get("investmentDate")),
        "completionDate": normalized_date(
            project.get("actualRepayment")
            or project.get("actualRepaymentDate")
        ),
        "country": nullable_text(project.get("country")),
        "interestRate": nullable_number(project.get("interestRate")),
        "incomeReceived": round(interest_received + extra_received, 2),
        "outstanding": outstanding,
        "delayDays": int(number(
            project.get("delayDays", project.get("delayedDays", 0))
        )),
        "ltv": nullable_number(project.get("ltv")),
        "quantity": None,
        "averagePrice": None,
        "marketPrice": None,
        "ticker": None,
        "isin": None,
        "rating": nullable_text(project.get("rating")),
        "maturityDate": normalized_date(
            project.get("plannedRepayment")
            or project.get("plannedRepaymentDate")
        ),
        "payments": map_payment_rows(project),
        # Leidžiami papildomi investicijos laukai.
        "interestStartDate": normalized_date(project.get("interestStart")),
        "durationMonths": int(number(project.get("durationMonths"))),
        "paymentFrequency": nullable_text(project.get("paymentFrequency")),
        "maxLtv": nullable_number(project.get("maxLtv")),
        "repaidPrincipal": number(project.get("repaidPrincipal")),
        "plannedInterest": number(project.get("plannedInterest")),
    }


def map_history(old_history: Any, latest_cash: float) -> list[dict[str, Any]]:
    if not isinstance(old_history, list):
        return []

    result: list[dict[str, Any]] = []

    for index, row in enumerate(old_history):
        if not isinstance(row, dict):
            continue

        date = normalized_date(row.get("date"))
        if not date:
            continue

        is_latest = index == len(old_history) - 1

        result.append({
            "date": date,
            "invested": number(row.get("invested")),
            "value": number(row.get("value")),
            "profit": number(row.get("profit")),
            # Senas failas neturi istorinės cash sekos.
            # Patikima aktuali reikšmė įrašoma tik paskutiniam mėnesiui.
            "cash": latest_cash if is_latest else 0.0,
            "income": number(
                row.get("monthlyProfit", row.get("income", 0))
            ),
        })

    return result


def main() -> int:
    source_path = locate_source()
    old = read_json(source_path)

    old_platform = old.get("platform", {})
    old_summary = old.get("summary", {})
    old_projects = old.get("projects", old.get("investments", []))

    if not isinstance(old_projects, list):
        raise ValueError("Seno JSON projects/investments laukas nėra masyvas.")

    # Testinis projektas į realų V2 portfelį nekeliamas.
    real_projects = [
        project
        for project in old_projects
        if isinstance(project, dict)
        and text(project.get("name")).lower() != "testas"
    ]

    investments = [map_investment(project) for project in real_projects]

    duplicate_codes = sorted(
        code
        for code, count in Counter(
            investment["code"] for investment in investments
        ).items()
        if count > 1
    )
    if duplicate_codes:
        raise ValueError(
            "Rasti dubliuoti Crowdpear projektų kodai: "
            + ", ".join(duplicate_codes)
        )

    active_count = sum(
        investment["status"] == "active" for investment in investments
    )
    delayed_count = sum(
        investment["status"] == "delayed" for investment in investments
    )
    completed_count = sum(
        investment["status"] == "completed" for investment in investments
    )

    deposited = number(
        old_summary.get("deposited", old_summary.get("invested"))
    )
    current_value = number(
        old_summary.get(
            "portfolioValue",
            old_summary.get("currentValue"),
        )
    )
    profit = number(
        old_summary.get("profit", current_value - deposited)
    )
    cash = number(old_summary.get("cash"))
    income_received = number(
        old_summary.get(
            "interestReceived",
            old_summary.get("incomeReceived"),
        )
    )

    output = {
        "schemaVersion": 1,
        "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "platform": {
            "id": "crowdpear",
            "slug": "crowdpear",
            "name": "Crowdpear",
            "group": "real_estate",
            "type": "real_estate",
            "category": text(old_platform.get("category"))
            or "NT sutelktinis finansavimas",
            "currency": "EUR",
            "active": text(old_platform.get("status")).lower() != "inactive",
            "startDate": normalized_date(old_platform.get("startDate")),
            "updatedAt": normalized_date(old_platform.get("updatedAt"))
            or datetime.now().date().isoformat(),
            "website": nullable_text(old_platform.get("website"))
            or "https://crowdpear.com",
        },
        "summary": {
            "invested": deposited,
            "currentValue": current_value,
            "profit": profit,
            "returnRate": nullable_number(
                old_summary.get("roi", old_summary.get("returnRate"))
            ),
            "xirr": nullable_number(old_summary.get("xirr")),
            "cash": cash,
            "incomeReceived": income_received,
            "activeInvestments": active_count,
            "delayedInvestments": delayed_count,
            "completedInvestments": completed_count,
            "averageRate": nullable_number(
                old_summary.get(
                    "averageInterest",
                    old_summary.get("averageRate"),
                )
            ),
            "averageLtv": nullable_number(old_summary.get("averageLtv")),
        },
        "history": map_history(old.get("history"), cash),
        "investments": investments,
    }

    write_json(OUTPUT_FILE, output)

    print("")
    print("CROWDPEAR V2.2.2 SUKURTA")
    print("=========================")
    print(f"Šaltinis: {source_path}")
    print(f"Rezultatas: {OUTPUT_FILE}")
    print(f"Investicijų: {len(investments)}")
    print(f"Aktyvių: {active_count}")
    print(f"Vėluojančių: {delayed_count}")
    print(f"Užbaigtų: {completed_count}")
    print(f"Portfelio vertė: {current_value:.2f} EUR")
    print("")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
