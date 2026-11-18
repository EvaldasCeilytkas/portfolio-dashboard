import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / "public" / "data" / "crowdpear.json"

def number(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0

def actual_totals(project):
    payments = project.get("payments") or []

    actual_rows = [
        row for row in payments
        if row.get("actualDate")
    ]

    actual_interest = round(
        sum(number(row.get("actualInterest")) for row in actual_rows),
        2,
    )
    actual_extra = round(
        sum(number(row.get("actualExtra")) for row in actual_rows),
        2,
    )

    planned_interest = round(
        sum(
            number(row.get("plannedInterest"))
            for row in payments
            if row.get("plannedDate")
        ),
        2,
    )

    return actual_interest, actual_extra, planned_interest

data = json.loads(FILE.read_text(encoding="utf-8"))

for project in data.get("projects", []):
    actual_interest, actual_extra, planned_interest = actual_totals(project)

    project["plannedInterest"] = planned_interest
    project["interestReceived"] = actual_interest
    project["extraReceived"] = actual_extra

largest = data.get("largestProject")
if largest:
    matching = next(
        (
            project
            for project in data.get("projects", [])
            if str(project.get("id")) == str(largest.get("id"))
        ),
        None,
    )
    if matching:
        data["largestProject"] = matching

FILE.write_text(
    json.dumps(data, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

print(f"Pataisyta: {FILE}")
