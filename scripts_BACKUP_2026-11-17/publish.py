from __future__ import annotations

import importlib
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent
REPO_ROOT = PROJECT_ROOT

UPDATE_ALL_FILE = SCRIPTS_DIR / "update_all.py"
IMPORT_STATUS_FILE = PROJECT_ROOT / "public" / "data" / "import_status.json"
WORKFLOW_FILE = PROJECT_ROOT / ".github" / "workflows" / "deploy.yml"

PUBLISH_PATHS = [
    ".github/workflows/deploy.yml",
    "src",
    "public",
    "index.html",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "eslint.config.js",
    "README.md",
]

class Colors:
    BLUE = "\033[94m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

def setup_terminal():
    if os.name == "nt":
        os.system("")
    for stream in (sys.stdout, sys.stderr):
        fn = getattr(stream, "reconfigure", None)
        if callable(fn):
            try:
                fn(encoding="utf-8", errors="replace")
            except (OSError, ValueError):
                pass

def color(text, code):
    return f"{code}{text}{Colors.RESET}" if sys.stdout.isatty() else text

def separator(width=68):
    return "=" * width

def run_command(command, cwd, capture=False):
    return subprocess.run(
        command,
        cwd=cwd,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=capture,
        check=False,
    )

def run_git(arguments, capture=False):
    return run_command(["git", *arguments], REPO_ROOT, capture)

def validate_repository():
    result = run_git(["rev-parse", "--show-toplevel"], capture=True)
    if result.returncode != 0:
        raise RuntimeError("Nerasta Git saugykla.")

    detected_root = Path(result.stdout.strip()).resolve()
    if detected_root != REPO_ROOT.resolve():
        raise RuntimeError(
            f"Netikėta Git saugyklos vieta: {detected_root}\n"
            f"Tikėtasi: {REPO_ROOT}"
        )

    if not WORKFLOW_FILE.is_file():
        raise RuntimeError(f"Nerastas GitHub Actions failas: {WORKFLOW_FILE}")

def run_update_all():
    if not UPDATE_ALL_FILE.is_file():
        raise RuntimeError(f"Nerastas failas: {UPDATE_ALL_FILE}")

    if str(SCRIPTS_DIR) not in sys.path:
        sys.path.insert(0, str(SCRIPTS_DIR))

    print(color("1/5  Atnaujinami portfelio duomenys...", Colors.BLUE))
    module = importlib.reload(sys.modules["update_all"]) if "update_all" in sys.modules else importlib.import_module("update_all")
    main_function = getattr(module, "main", None)

    if not callable(main_function):
        raise RuntimeError("update_all.py faile nerasta main() funkcija.")

    exit_code = main_function()
    if exit_code not in (None, 0):
        raise RuntimeError(f"update_all.py grąžino klaidos kodą {exit_code}.")

def validate_import_status():
    if not IMPORT_STATUS_FILE.is_file():
        raise RuntimeError(f"Nerastas failas: {IMPORT_STATUS_FILE}")

    try:
        status = json.loads(IMPORT_STATUS_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Netinkamas import_status.json: {exc}") from exc

    summary = status.get("summary") if isinstance(status.get("summary"), dict) else {}
    failed = int(summary.get("failed") or 0)
    total = int(summary.get("total") or 0)
    ok = int(summary.get("ok") or 0)

    if total <= 0:
        raise RuntimeError("import_status.json neturi platformų suvestinės.")
    if failed > 0 or ok != total:
        raise RuntimeError(f"Importai: {ok}/{total}, klaidų: {failed}.")

    return status

def validate_react_build():
    print(color("2/5  Tikrinamas React production build...", Colors.BLUE))
    npm = shutil.which("npm.cmd" if os.name == "nt" else "npm") or shutil.which("npm")
    if not npm:
        raise RuntimeError("Nerasta npm komanda. Patikrink Node.js diegimą.")

    result = run_command([npm, "run", "build"], PROJECT_ROOT)
    if result.returncode != 0:
        raise RuntimeError(f"React build nepavyko. Klaidos kodas: {result.returncode}")

    if not (PROJECT_ROOT / "dist" / "index.html").is_file():
        raise RuntimeError("Po build nerastas dist/index.html.")

def stage_publishable_files():
    print(color("3/5  Ruošiami vieši projekto failai...", Colors.BLUE))
    existing = [p for p in PUBLISH_PATHS if (REPO_ROOT / p).exists()]
    if not existing:
        raise RuntimeError("Nerasta publikuojamų failų.")

    result = run_git(["add", "-A", "--", *existing])
    if result.returncode != 0:
        raise RuntimeError("git add nepavyko.")

def has_staged_changes():
    return run_git(["diff", "--cached", "--quiet"]).returncode == 1

def commit_changes(status):
    if not has_staged_changes():
        print(color("Naujų publikuojamų pakeitimų nėra.", Colors.YELLOW))
        return False

    print(color("4/5  Kuriamas Git commit...", Colors.BLUE))
    platform_count = int((status.get("summary") or {}).get("ok") or 0)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    message = f"Portfolio update {timestamp} ({platform_count} platforms)"

    if run_git(["commit", "-m", message]).returncode != 0:
        raise RuntimeError("Git commit nepavyko.")
    return True

def push_changes():
    print(color("5/5  Pakeitimai siunčiami į GitHub...", Colors.BLUE))
    branch_result = run_git(["branch", "--show-current"], capture=True)
    branch = branch_result.stdout.strip() if branch_result.returncode == 0 else ""

    if not branch:
        raise RuntimeError("Nepavyko nustatyti Git šakos.")
    if run_git(["push", "origin", branch]).returncode != 0:
        raise RuntimeError("Git push nepavyko.")

def main():
    setup_terminal()
    print()
    print(color(separator(), Colors.BLUE))
    print(color("PORTFOLIO DASHBOARD – UPDATE & PUBLISH V4", Colors.BOLD))
    print(f"Projektas: {PROJECT_ROOT}")
    print(color(separator(), Colors.BLUE))
    print()

    try:
        validate_repository()
        run_update_all()
        status = validate_import_status()
        validate_react_build()
        stage_publishable_files()
        committed = commit_changes(status)
        if committed:
            push_changes()
    except Exception as exc:
        print()
        print(color(separator(), Colors.RED))
        print(color("PUBLIKAVIMAS SUSTABDYTAS", Colors.RED))
        print(str(exc))
        print(color(separator(), Colors.RED))
        print()
        return 1

    print()
    print(color(separator(), Colors.GREEN))
    print(color("PORTFELIS SĖKMINGAI IŠSIŲSTAS Į GITHUB", Colors.GREEN))
    print("GitHub Actions dabar publikuos svetainę.")
    print(f"Baigta: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(color(separator(), Colors.GREEN))
    print()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
