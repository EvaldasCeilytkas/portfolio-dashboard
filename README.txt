RIMA – DEBITUM prijungimas

1. Atnaujintame src pakete Rimos P2P sąraše pridėtas slug "debitum".
2. scripts/import_rima_debitum.py naudoja esamą scripts/import_debitum.py logiką.
3. Rimos Excel turi būti: excel/Debitum Rima.xlsx
4. Išvestis: public/data/rima/platforms/debitum.json

Svarbu: kad Debitum būtų generuojamas kartu su viso Rimos portfelio atnaujinimu,
į esamą scripts/import_rima_portfolio.py reikia įtraukti šio importerio paleidimą.
