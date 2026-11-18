from __future__ import annotations

import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = PROJECT_ROOT / "scripts"

if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))


def main() -> int:
    try:
        from common import (
            BaseImporter,
            BrokerImporter,
            PlatformConfig,
            run_import,
            validate_platform_document,
            write_json,
        )
    except Exception as error:
        print()
        print("COMMON PATIKRA NEPAVYKO")
        print("======================")
        print(f"Klaida: {error}")
        print()
        return 1

    exports = {
        "BaseImporter": BaseImporter,
        "BrokerImporter": BrokerImporter,
        "PlatformConfig": PlatformConfig,
        "run_import": run_import,
        "validate_platform_document": validate_platform_document,
        "write_json": write_json,
    }

    print()
    print("COMMON PATIKRA SĖKMINGA")
    print("=======================")
    for name, value in exports.items():
        print(f"[OK] {name}: {value}")
    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
