from __future__ import annotations
import subprocess, sys, json
from pathlib import Path
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parents[1]
def run(script):
    code=subprocess.call([sys.executable,str(ROOT/"scripts"/script)],cwd=ROOT)
    if code: raise SystemExit(code)
run("import_gerda_dashboard.py")
run("import_profitus_gerda.py")
p=json.loads((ROOT/"public/data/gerda/platforms/profitus.json").read_text(encoding="utf-8")); s=p["summary"]; plat=p["platform"]
out={"schemaVersion":1,"generatedAt":datetime.now(timezone.utc).isoformat(timespec="seconds"),"currency":"EUR","summary":{"invested":s["invested"],"currentValue":s["currentValue"],"profit":s["profit"],"returnRate":s["returnRate"],"xirr":s.get("xirr"),"cash":s.get("cash",0),"incomeReceived":s.get("incomeReceived",0),"platformCount":1,"activeInvestments":s.get("activeInvestments",0),"delayedInvestments":s.get("delayedInvestments",0),"completedInvestments":s.get("completedInvestments",0)},"allocation":[{"group":"real_estate","name":"NT sutelktinis finansavimas","invested":s["invested"],"currentValue":s["currentValue"],"profit":s["profit"],"cash":s.get("cash",0),"percentage":100.0,"platformCount":1}],"platforms":[{**plat,"sourceFile":"profitus.json","summary":s}]}
(ROOT/"public/data/gerda/portfolio.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("[OK] Gerdos portfelis atnaujintas")
