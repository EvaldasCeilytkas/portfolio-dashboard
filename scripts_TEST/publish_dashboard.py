from __future__ import annotations

import json
import shutil
import subprocess
import sys
import webbrowser
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PACKAGE_JSON = PROJECT_ROOT / "package.json"
DASHBOARD_URL = "https://evaldasceilytkas.github.io/portfolio-dashboard/"


def resolve_command(*names: str) -> str:
    for name in names:
        resolved = shutil.which(name)
        if resolved:
            return resolved
    raise RuntimeError(
        "Windows nerado nė vienos komandos: " + ", ".join(names)
    )


def run(
    command: list[str],
    *,
    cwd: Path,
    check: bool = True,
    capture: bool = False,
) -> subprocess.CompletedProcess[str]:
    print(">", " ".join(command))

    result = subprocess.run(
        command,
        cwd=str(cwd),
        text=True,
        capture_output=capture,
        check=False,
    )

    stdout = (result.stdout or "").strip()
    stderr = (result.stderr or "").strip()

    if capture:
        if stdout:
            print(stdout)
        if stderr:
            print(stderr, file=sys.stderr)

    if check and result.returncode != 0:
        raise RuntimeError(
            stderr
            or stdout
            or (
                f"Komanda baigta su klaida {result.returncode}: "
                + " ".join(command)
            )
        )

    return result


def read_package_scripts() -> dict[str, str]:
    if not PACKAGE_JSON.is_file():
        raise FileNotFoundError(f"Nerastas failas: {PACKAGE_JSON}")

    with PACKAGE_JSON.open("r", encoding="utf-8") as file:
        package = json.load(file)

    scripts = package.get("scripts", {})
    return scripts if isinstance(scripts, dict) else {}


def find_git_root(git_command: str) -> Path:
    result = run(
        [git_command, "rev-parse", "--show-toplevel"],
        cwd=PROJECT_ROOT,
        capture=True,
    )

    root = Path((result.stdout or "").strip()).resolve()
    if not root.is_dir():
        raise RuntimeError(f"Neteisingas Git šaknies kelias: {root}")

    return root


def git_output(
    git_command: str,
    git_root: Path,
    *args: str,
) -> str:
    result = run(
        [git_command, *args],
        cwd=git_root,
        capture=True,
    )
    return (result.stdout or "").strip()


def ensure_requirements() -> tuple[str, str, Path]:
    npm_command = resolve_command("npm.cmd", "npm")
    git_command = resolve_command("git.exe", "git")

    scripts = read_package_scripts()
    if "build" not in scripts:
        raise RuntimeError(
            "package.json faile nerasta komanda scripts.build."
        )

    git_root = find_git_root(git_command)
    return npm_command, git_command, git_root


def build_react(npm_command: str) -> None:
    print()
    print("=" * 68)
    print(" REACT BUILD")
    print("=" * 68)

    run(
        [npm_command, "run", "build"],
        cwd=PROJECT_ROOT,
    )


def commit_changes(git_command: str, git_root: Path) -> bool:
    print()
    print("=" * 68)
    print(" GIT PAKEITIMAI")
    print("=" * 68)
    print(f"Git repozitorija: {git_root}")

    status_before = git_output(
        git_command,
        git_root,
        "status",
        "--porcelain",
    )

    if not status_before:
        print("Pakeistų failų nėra. Naujas commit nereikalingas.")
        return False

    print(status_before)
    print()

    run(
        [git_command, "add", "-A"],
        cwd=git_root,
    )

    staged = git_output(
        git_command,
        git_root,
        "diff",
        "--cached",
        "--name-only",
    )

    if not staged:
        print("Po git add nėra commit skirtų pakeitimų.")
        return False

    message = datetime.now().astimezone().strftime(
        "Dashboard update %Y-%m-%d %H:%M"
    )

    run(
        [git_command, "commit", "-m", message],
        cwd=git_root,
    )

    print(f"Commit sukurtas: {message}")
    return True


def sync_with_remote(
    git_command: str,
    git_root: Path,
    branch: str,
) -> None:
    print()
    print("=" * 68)
    print(" GIT SINCHRONIZACIJA")
    print("=" * 68)

    print("Paimami naujausi GitHub pakeitimai...")
    run(
        [git_command, "pull", "--rebase", "origin", branch],
        cwd=git_root,
    )


def push_changes(git_command: str, git_root: Path) -> None:
    print()
    print("=" * 68)
    print(" GIT PUSH")
    print("=" * 68)

    branch = git_output(
        git_command,
        git_root,
        "branch",
        "--show-current",
    )

    if not branch:
        raise RuntimeError("Nepavyko nustatyti aktyvios Git šakos.")

    print(f"Aktyvi šaka: {branch}")

    # Pirmiausia įtraukiami nuotoliniai pakeitimai.
    # --rebase išlaiko tvarkingą istoriją be papildomo merge commit.
    sync_with_remote(git_command, git_root, branch)

    run(
        [git_command, "push", "origin", branch],
        cwd=git_root,
    )


def open_dashboard() -> None:
    print()
    print(f"Dashboard: {DASHBOARD_URL}")
    webbrowser.open(DASHBOARD_URL, new=2)


def main() -> int:
    print()
    print("=" * 68)
    print(" PORTFOLIO ANALYTICS - PUBLIKAVIMAS")
    print("=" * 68)
    print(f"React projektas: {PROJECT_ROOT}")

    try:
        npm_command, git_command, git_root = ensure_requirements()

        print(f"NPM komanda: {npm_command}")
        print(f"Git komanda: {git_command}")
        print(f"Git repozitorija: {git_root}")

        build_react(npm_command)
        created_commit = commit_changes(git_command, git_root)
        push_changes(git_command, git_root)

    except (
        FileNotFoundError,
        json.JSONDecodeError,
        OSError,
        RuntimeError,
    ) as error:
        print()
        print("=" * 68)
        print(" PUBLIKAVIMAS NEPAVYKO")
        print("=" * 68)
        print(f"KLAIDA: {error}")
        print()
        print(
            "Jeigu Git pranešė apie konfliktą, neatlikite naujo commit. "
            "Pirmiausia išspręskite pažymėtus konfliktus ir paleiskite failą dar kartą."
        )
        print()
        return 1

    print()
    print("=" * 68)
    print(" PUBLIKAVIMAS BAIGTAS SĖKMINGAI")
    print("=" * 68)

    if created_commit:
        print("Nauji pakeitimai įkelti į GitHub.")
    else:
        print("Naujo commit nereikėjo; GitHub sinchronizacija patikrinta.")

    print("GitHub Pages gali atsinaujinti per 1–3 minutes.")
    open_dashboard()
    print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
