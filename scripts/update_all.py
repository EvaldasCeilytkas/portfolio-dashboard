from __future__ import annotations

import json
import importlib
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


# ============================================================
# Portfolio Analytics – bendras V1 atnaujinimas
# Paleidimas iš projekto šakninio aplanko:
#     python scripts/update_all.py
# ============================================================

SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent
DATA_DIR = PROJECT_ROOT / "public" / "data"
PORTFOLIO_FILE = DATA_DIR / "portfolio.json"
IMPORT_STATUS_FILE = DATA_DIR / "import_status.json"


# Leidžia importuoti tame pačiame aplanke esančius update_*.py failus.
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))


PLATFORM_TASK_FILES = {
    "seb mikro": "update_portfolio.py",
    "revolut brokerage": "update_portfolio.py",
    "afranga": "update_portfolio.py",
    "debitum": "update_portfolio.py",
    "indemo": "update_portfolio.py",
    "seb robo": "update_brokers.py",
    "seb fondai": "update_brokers.py",
    "revolut robo": "update_brokers.py",
    "synergy": "update_brokers.py",
    "crowdpear": "update_crowdpear.py",
    "income": "update_income.py",
    "lande": "update_lande.py",
    "lendermarket": "update_lendermarket.py",
    "loanch": "update_loanch.py",
    "nectaro": "update_nectaro.py",
    "peerberry": "update_peerberry.py",
    "scramble": "update_scramble.py",
    "viainvest": "update_viainvest.py",
}


@dataclass(frozen=True)
class UpdateTask:
    name: str
    filename: str


# Vykdymo tvarka yra svarbi:
# 1) sukuriamas / atnaujinamas pagrindinis portfolio.json;
# 2) į jį įrašomi brokerių duomenys;
# 3) atnaujinamos atskiros P2P platformos.
UPDATE_TASKS = [
    UpdateTask("Pagrindinis portfelis", "update_portfolio.py"),
    UpdateTask("Brokeriai", "update_brokers.py"),
    UpdateTask("Crowdpear", "update_crowdpear.py"),
    UpdateTask("Income", "update_income.py"),
    UpdateTask("Lande", "update_lande.py"),
    UpdateTask("Lendermarket", "update_lendermarket.py"),
    UpdateTask("Loanch", "update_loanch.py"),
    UpdateTask("Nectaro", "update_nectaro.py"),
    UpdateTask("PeerBerry", "update_peerberry.py"),
    UpdateTask("Scramble", "update_scramble.py"),
    UpdateTask("ViaInvest", "update_viainvest.py"),
]


class Colors:
    BLUE = "\033[94m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def enable_windows_ansi() -> None:
    """Įjungia ANSI spalvas ir UTF-8 išvestį Windows terminale."""
    if os.name == "nt":
        os.system("")

    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except (OSError, ValueError):
                pass


def color(text: str, code: str) -> str:
    if not sys.stdout.isatty():
        return text
    return f"{code}{text}{Colors.RESET}"


def separator(character: str = "=", width: int = 68) -> str:
    return character * width


def print_header() -> None:
    print()
    print(color(separator(), Colors.BLUE))
    print(color("PORTFOLIO ANALYTICS – VISŲ DUOMENŲ ATNAUJINIMAS V1", Colors.BOLD))
    print(f"Pradėta: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Projektas: {PROJECT_ROOT}")
    print(color(separator(), Colors.BLUE))


def run_task(task: UpdateTask, index: int, total: int) -> tuple[bool, float, str]:
    script_path = SCRIPTS_DIR / task.filename

    print()
    print(color(f"[{index}/{total}] ▶ {task.name}", Colors.BLUE))
    print(f"Failas: scripts/{task.filename}")

    if not script_path.is_file():
        message = f"Failas nerastas: {script_path}"
        print(color(f"⚠ PRALEISTA – {message}", Colors.YELLOW))
        return False, 0.0, message

    module_name = script_path.stem
    started = time.perf_counter()

    try:
        # Visi atnaujinimo skriptai vykdomi tame pačiame Python procese.
        # Taip išvengiama Windows subprocess/cp1252 koduotės problemų.
        if module_name in sys.modules:
            module = importlib.reload(sys.modules[module_name])
        else:
            module = importlib.import_module(module_name)

        main_function = getattr(module, "main", None)

        if not callable(main_function):
            raise AttributeError(
                f"Faile {task.filename} nerasta iškviečiama main() funkcija."
            )

        main_function()

    except SystemExit as exc:
        # Kai kurie skriptai gali naudoti raise SystemExit(main()).
        exit_code = exc.code if isinstance(exc.code, int) else 0
        duration = time.perf_counter() - started

        if exit_code == 0:
            print(color(f"✓ BAIGTA SĖKMINGAI ({duration:.2f} s)", Colors.GREEN))
            return True, duration, ""

        message = f"Skriptas baigė darbą su kodu {exit_code}"
        print(color(f"✗ KLAIDA ({duration:.2f} s)", Colors.RED))
        print(message)
        return False, duration, message

    except Exception as exc:
        import traceback

        duration = time.perf_counter() - started
        error_text = traceback.format_exc().rstrip()

        print(color(f"✗ KLAIDA ({duration:.2f} s)", Colors.RED))
        print(error_text)

        return False, duration, str(exc) or exc.__class__.__name__

    duration = time.perf_counter() - started
    print(color(f"✓ BAIGTA SĖKMINGAI ({duration:.2f} s)", Colors.GREEN))
    return True, duration, ""

def normalize_name(value: object) -> str:
    return " ".join(str(value or "").strip().lower().split())


def infer_module_type(platform: dict) -> str:
    details = platform.get("details")
    details = details if isinstance(details, dict) else {}

    values = [
        details.get("type"),
        platform.get("assetClass"),
        platform.get("category"),
        platform.get("type"),
    ]
    combined = " ".join(str(value or "").lower() for value in values)

    if "p2p" in combined or "loan" in combined or "real estate" in combined:
        return "p2p"
    if "broker" in combined or "robo" in combined or "fund" in combined:
        return "brokerage"
    if "etf" in combined:
        return "etf"

    return "brokerage"


def count_platform_records(platform: dict) -> int:
    details = platform.get("details")
    details = details if isinstance(details, dict) else {}

    candidates = [
        details.get("positions"),
        details.get("loans"),
        details.get("projects"),
        platform.get("positions"),
        platform.get("loans"),
        platform.get("projects"),
        platform.get("holdings"),
    ]

    for candidate in candidates:
        if isinstance(candidate, list):
            return len(candidate)

        if isinstance(candidate, dict):
            counts = candidate.get("counts")
            if isinstance(counts, dict):
                total = counts.get("total")
                if isinstance(total, (int, float)):
                    return int(total)

            if isinstance(candidate.get("all"), list):
                return len(candidate["all"])

            total = 0
            found_list = False
            for key in ("active", "sold", "closed", "late", "completed"):
                value = candidate.get(key)
                if isinstance(value, list):
                    total += len(value)
                    found_list = True

            if found_list:
                return total

    return 0


def latest_platform_date(platform: dict) -> str:
    history = platform.get("history")
    if not isinstance(history, list):
        return ""

    dates = [
        str(item.get("date"))
        for item in history
        if isinstance(item, dict) and item.get("date")
    ]
    return max(dates) if dates else ""


def platform_source_file(platform: dict) -> str:
    details = platform.get("details")
    details = details if isinstance(details, dict) else {}

    source_file = (
        details.get("sourceFile")
        or platform.get("sourceFile")
        or platform.get("excelFile")
    )
    if source_file:
        return str(source_file)

    name = str(platform.get("name") or "").strip()
    return f"{name}.xlsx" if name else "–"


def write_import_status(
    results: list[tuple[UpdateTask, bool, float, str]],
    total_duration: float,
) -> tuple[bool, str]:
    """Sukuria Data Center naudojamą public/data/import_status.json."""
    result_by_filename = {
        task.filename: {
            "success": success,
            "duration": duration,
            "error": error,
        }
        for task, success, duration, error in results
    }

    try:
        with PORTFOLIO_FILE.open("r", encoding="utf-8") as file:
            portfolio = json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        return False, f"Nepavyko perskaityti {PORTFOLIO_FILE}: {exc}"

    platforms = portfolio.get("platforms")
    platforms = platforms if isinstance(platforms, list) else []

    status_platforms = []

    for platform in platforms:
        if not isinstance(platform, dict):
            continue

        platform_name = str(platform.get("name") or "Nežinoma platforma")
        task_filename = PLATFORM_TASK_FILES.get(
            normalize_name(platform_name),
            "update_portfolio.py",
        )
        task_result = result_by_filename.get(
            task_filename,
            {
                "success": False,
                "duration": 0.0,
                "error": f"Nerastas susietas etapas: {task_filename}",
            },
        )

        status_platforms.append(
            {
                "platformName": platform_name,
                "moduleType": infer_module_type(platform),
                "sourceFile": platform_source_file(platform),
                "status": "ok" if task_result["success"] else "error",
                "records": count_platform_records(platform),
                "latestDataDate": latest_platform_date(platform),
                "durationSeconds": round(float(task_result["duration"]), 3),
                "error": "" if task_result["success"] else str(task_result["error"]),
                "task": task_filename,
            }
        )

    payload = {
        "schemaVersion": portfolio.get("schemaVersion"),
        "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "durationSeconds": round(total_duration, 3),
        "portfolioJsonBytes": PORTFOLIO_FILE.stat().st_size,
        "portfolioUpdatedAt": portfolio.get("updatedAt"),
        "platforms": status_platforms,
        "summary": {
            "total": len(status_platforms),
            "ok": sum(item["status"] == "ok" for item in status_platforms),
            "failed": sum(item["status"] != "ok" for item in status_platforms),
        },
    }

    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with IMPORT_STATUS_FILE.open("w", encoding="utf-8") as file:
            json.dump(payload, file, ensure_ascii=False, indent=2)
    except OSError as exc:
        return False, f"Nepavyko įrašyti {IMPORT_STATUS_FILE}: {exc}"

    return True, str(IMPORT_STATUS_FILE)

def main() -> int:
    enable_windows_ansi()
    print_header()

    if not SCRIPTS_DIR.is_dir():
        print(color(f"Klaida: nerastas scripts aplankas: {SCRIPTS_DIR}", Colors.RED))
        return 2

    results: list[tuple[UpdateTask, bool, float, str]] = []
    total_started = time.perf_counter()

    for index, task in enumerate(UPDATE_TASKS, start=1):
        success, duration, error = run_task(task, index, len(UPDATE_TASKS))
        results.append((task, success, duration, error))

    total_duration = time.perf_counter() - total_started

    status_created, status_message = write_import_status(results, total_duration)
    if status_created:
        print()
        print(color("✓ Data Center būsena atnaujinta", Colors.GREEN))
        print(f"Failas: {status_message}")
    else:
        print()
        print(color("✗ Nepavyko atnaujinti Data Center būsenos", Colors.RED))
        print(status_message)

    successful = sum(1 for _, success, _, _ in results if success)
    failed = len(results) - successful

    print()
    print(color(separator(), Colors.BLUE))
    print(color("ATNAUJINIMO SUVESTINĖ", Colors.BOLD))
    print(color(f"✓ Sėkmingai: {successful}", Colors.GREEN))

    if failed:
        print(color(f"✗ Nepavyko / praleista: {failed}", Colors.RED))
    else:
        print(color("✗ Klaidų: 0", Colors.GREEN))

    print(f"Bendra trukmė: {total_duration:.2f} s")
    print(f"Baigta: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if failed:
        print()
        print(color("Nepavykę etapai:", Colors.RED))
        for task, success, _, error in results:
            if not success:
                first_line = error.splitlines()[0] if error else "Nežinoma klaida"
                print(f"  - {task.name} ({task.filename}): {first_line}")
        print()
        print("Likę skriptai buvo vykdomi toliau. Patikrink aukščiau parodytas klaidas.")
    else:
        print()
        print(color("Visi duomenys atnaujinti sėkmingai.", Colors.GREEN))

    print(color(separator(), Colors.BLUE))
    print()

    # 0 – viskas gerai; 1 – bent vienas etapas nepavyko.
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
