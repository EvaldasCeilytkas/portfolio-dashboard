from __future__ import annotations

import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = PROJECT_ROOT / "scripts"


@dataclass(frozen=True)
class Step:
    name: str
    script: str


STEPS = [
    Step("Afranga", "import_afranga.py"),
    Step("Crowdpear", "import_crowdpear.py"),
    Step("Debitum", "import_debitum.py"),
    Step("Income", "import_income.py"),
    Step("Indemo", "import_indemo.py"),
    Step("Lande", "import_lande.py"),
    Step("Lendermarket", "import_lendermarket.py"),
    Step("Loanch", "import_loanch.py"),
    Step("Nectaro", "import_nectaro.py"),
    Step("Nordstreet", "import_nordstreet.py"),
    Step("PeerBerry", "import_peerberry.py"),
    Step("Profitus", "import_profitus.py"),
    Step("Revolut Brokerage", "import_revolut_brokerage.py"),
    Step("Revolut Robo", "import_revolut_robo.py"),
    Step("Rontgen", "import_rontgen.py"),
    Step("Scramble", "import_scramble.py"),
    Step("SEB Fondai", "import_seb_fondai.py"),
    Step("SEB Mikro", "import_seb_mikro.py"),
    Step("SEB Robo", "import_seb_robo.py"),
    Step("Synergy", "import_synergy.py"),
    Step("TWINO", "import_twino.py"),
    Step("Viainvest", "import_viainvest.py"),
    Step("Platformų registro tikrinimas", "validate_platform_registry.py"),
    Step("Portfolio JSON sukūrimas", "build_portfolio.py"),
    Step("Portfelio istorijos sukūrimas", "update_history.py"),
]


def run_step(index: int, total: int, step: Step) -> bool:
    script_path = SCRIPTS_DIR / step.script

    print()
    print("-" * 68)
    print(f"[{index}/{total}] {step.name}")
    print(f"Failas: scripts\\{step.script}")
    print("-" * 68)

    started = time.perf_counter()
    result = subprocess.run(
        [sys.executable, str(script_path)],
        cwd=str(PROJECT_ROOT),
        check=False,
    )
    elapsed = time.perf_counter() - started

    if result.returncode == 0:
        print(f"[OK] {step.name} ({elapsed:.1f} s)")
        return True

    print(f"[KLAIDA] {step.name}: procesas baigtas kodu {result.returncode} ({elapsed:.1f} s)")
    return False


def main() -> int:
    print()
    print("=" * 68)
    print(" PORTFOLIO ANALYTICS - VISŲ DUOMENŲ ATNAUJINIMAS")
    print("=" * 68)
    print(f"Projektas: {PROJECT_ROOT}")
    print(f"Python:    {sys.executable}")
    print()

    missing = [
        SCRIPTS_DIR / step.script
        for step in STEPS
        if not (SCRIPTS_DIR / step.script).is_file()
    ]

    if missing:
        print("KLAIDA: nerasti reikalingi failai:")
        for path in missing:
            print(f" - {path.relative_to(PROJECT_ROOT)}")
        print()
        return 1

    total = len(STEPS)

    for index, step in enumerate(STEPS, start=1):
        if not run_step(index, total, step):
            print()
            print("=" * 68)
            print(" ATNAUJINIMAS SUSTABDYTAS")
            print("=" * 68)
            print(f"Nepavyko žingsnis: {step.name}")
            print(f"Failas: scripts\\{step.script}")
            print()
            return 1

    print()
    print("=" * 68)
    print(" ATNAUJINIMAS BAIGTAS SĖKMINGAI")
    print("=" * 68)
    print("Atnaujinta:")
    print(" - visų platformų JSON")
    print(" - public\\data\\portfolio.json")
    print(" - public\\data\\portfolio_history.json")
    print(" - public\\data\\funds_history.json")
    print(" - public\\data\\p2p_history.json")
    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
