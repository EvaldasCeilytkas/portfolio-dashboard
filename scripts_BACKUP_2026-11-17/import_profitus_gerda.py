from __future__ import annotations
import subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
cmd=[sys.executable,str(ROOT/"scripts"/"import_profitus.py"),"--input",str(ROOT/"excel"/"Profitus Gerda.xlsx"),"--output",str(ROOT/"public"/"data"/"gerda"/"platforms"/"profitus.json")]
raise SystemExit(subprocess.call(cmd,cwd=ROOT))
