import sys
import tempfile
from pathlib import Path

sys.path.insert(0, "scripts_TEST")
from common.excel_paths import excel_path, excel_glob

with tempfile.TemporaryDirectory() as folder:
    p = Path(folder)

    (p / "test.xlsx").touch()
    assert excel_path(p / "test.xlsx").suffix == ".xlsx"
    print("1. XLSX veikia")

    (p / "test.xlsm").touch()
    assert excel_path(p / "test.xlsx").suffix == ".xlsm"
    print("2. XLSM pirmenybe veikia")

    files = excel_glob(p, "*.xlsx")
    assert len(files) == 1
    assert files[0].suffix == ".xlsm"
    print("3. Dublikatu nera")