from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data"
OUT = DATA / "sync_status.json"


def load(path: Path, default=None):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def record_count(payload):
    if not isinstance(payload, dict):
        return 0
    for key in ("investments", "loans", "projects", "positions", "records"):
        value = payload.get(key)
        if isinstance(value, list):
            return len(value)
    summary = payload.get("summary") or {}
    for key in ("total", "totalInvestments", "investmentCount", "positions"):
        if isinstance(summary.get(key), (int, float)):
            return int(summary[key])
    return 0


def platform_row(path: Path, owner_id: str, owner_name: str):
    payload = load(path, {}) or {}
    platform = payload.get("platform") or {}
    summary = payload.get("summary") or {}
    generated = payload.get("generatedAt") or datetime.fromtimestamp(path.stat().st_mtime).astimezone().isoformat()
    return {
        "platformName": platform.get("name") or platform.get("displayName") or path.stem.replace("-", " ").title(),
        "ownerId": owner_id,
        "ownerName": owner_name,
        "moduleType": platform.get("type") or "portfolio",
        "sourceFile": platform.get("sourceFile") or summary.get("sourceFile") or "Excel / JSON",
        "status": "ok",
        "records": record_count(payload),
        "latestDataDate": summary.get("latestDataDate") or generated[:10],
        "durationSeconds": 0,
        "error": "",
        "task": "portfolio importer",
    }


def profile_status(owner_id: str, name: str, initials: str, folder: Path, rows: list[dict]):
    history = load(folder / "portfolio_history.json", {}) or {}
    points = history.get("history") if isinstance(history, dict) else history
    latest = points[-1] if isinstance(points, list) and points else {}
    updated = latest.get("date") if isinstance(latest, dict) else None
    if not updated:
        newest = max((p.stat().st_mtime for p in folder.rglob("*.json")), default=0)
        updated = datetime.fromtimestamp(newest).astimezone().isoformat() if newest else None
    return {
        "id": owner_id,
        "name": name,
        "initials": initials,
        "status": "ok" if rows else "warning",
        "updatedAt": updated,
        "platforms": len(rows),
        "records": sum(int(row.get("records") or 0) for row in rows),
    }


def main():
    main_status = load(DATA / "import_status.json", {}) or {}
    evaldas_rows = []
    for row in main_status.get("platforms", []):
        item = dict(row)
        item["ownerId"] = "evaldas"
        item["ownerName"] = "Evaldas"
        evaldas_rows.append(item)

    rima_rows = [platform_row(path, "rima", "Rima") for path in sorted((DATA / "rima" / "platforms").glob("*.json"))]
    gerda_rows = [platform_row(path, "gerda", "Gerda") for path in sorted((DATA / "gerda" / "platforms").glob("*.json"))]
    rows = evaldas_rows + rima_rows + gerda_rows

    now = datetime.now().astimezone()
    errors = [r for r in rows if r.get("status") not in ("ok", "warning")]
    warnings = [r for r in rows if r.get("status") == "warning"]
    log = [
        {"time": now.strftime("%H:%M:%S"), "level": "info", "message": "Sync būsenos ataskaita sugeneruota."},
        {"time": now.strftime("%H:%M:%S"), "level": "success", "message": f"Evaldas: {len(evaldas_rows)} platformų patikrinta."},
        {"time": now.strftime("%H:%M:%S"), "level": "success", "message": f"Rima: {len(rima_rows)} platformų patikrinta."},
        {"time": now.strftime("%H:%M:%S"), "level": "success", "message": f"Gerda: {len(gerda_rows)} platformų patikrinta."},
    ]
    if warnings:
        log.append({"time": now.strftime("%H:%M:%S"), "level": "warning", "message": f"Rasta perspėjimų: {len(warnings)}."})
    if errors:
        log.append({"time": now.strftime("%H:%M:%S"), "level": "error", "message": f"Rasta klaidų: {len(errors)}."})
    else:
        log.append({"time": now.strftime("%H:%M:%S"), "level": "success", "message": "Kritinių duomenų klaidų nerasta."})

    payload = {
        "schemaVersion": 1,
        "generatedAt": now.isoformat(),
        "durationSeconds": main_status.get("durationSeconds", 0),
        "portfolios": [
            profile_status("evaldas", "Evaldas", "EČ", DATA, evaldas_rows),
            profile_status("rima", "Rima", "R", DATA / "rima", rima_rows),
            profile_status("gerda", "Gerda", "G", DATA / "gerda", gerda_rows),
        ],
        "platforms": rows,
        "log": log,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Sync status: {OUT}")


if __name__ == "__main__":
    main()
