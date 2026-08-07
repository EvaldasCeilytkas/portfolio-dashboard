PORTFOLIO DASHBOARD V2.5.4.1 – RIMA LOANCH HOTFIX
=================================================

Pataisyta:
1. import_rima_dashboard.py vėl generuoja React laukiamą JSON struktūrą:
   schemaVersion/type/section/currency/generatedAt/source/period/latest/history.
2. Suvestinių stulpeliai (Fondai / P2P / Viso) randami dinamiškai pagal antraštes.
3. import_rima_portfolio.py naudoja Auto Platform Engine registrą.
4. platforms.json: Loanch turi owners [evaldas, rima] ir ownerSources.rima = Loanch Rima.xlsx.

Kopijuoti į projektą (pakeičiant esamus):
- scripts/import_rima_dashboard.py
- scripts/import_rima_portfolio.py
- src/data/platforms.json
- excel/Investavimas Rima.xlsx
- excel/Loanch Rima.xlsx

Tada paleisti įprastą ATNAUJINTI_VISUS_PORTFELIUS...bat.

PASTABA:
Dabartiniame Investavimas Rima.xlsx Debitum ir Loanch mėnesio istorijos reikšmės yra 0.
Todėl generate_platform_history.py jų neįrašo į platform_history.json, kol nėra bent vienos
nenulinės Investuota/Vertė reikšmės. Tai normalu. Atskirą Loanch platformos JSON Auto Engine
generuoja iš Loanch Rima.xlsx.
