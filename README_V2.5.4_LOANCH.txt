V2.5.4 – RIMA LOANCH TESTAS
============================

Kas pakeista:
- src/data/platforms.json: Loanch owners papildytas "rima".
- Loanch ownerSources.rima = "Loanch Rima.xlsx".
- Pridėti testui reikalingi Excel failai teisingais projekto pavadinimais.

Kopijavimas į projekto šaknį:
1. src/data/platforms.json -> pakeisti esamą failą.
2. excel/Loanch Rima.xlsx -> į projekto excel aplanką.
3. excel/Investavimas Rima.xlsx -> pakeisti esamą Rimos investavimo failą.

Papildomų pakeitimų import_rima_portfolio.py ar P2PPage.jsx nereikia,
jeigu jau įdiegta V2.5.4 Auto Platform Engine.

Po kopijavimo paleisti įprastą ATNAUJINTI_VISUS_PORTFELIUS...bat.

Tikėtinas Rimos Auto Platform Engine pranešimas:
Rasta platformų: 9

Loanch turi būti automatiškai generuojamas į:
public/data/rima/platforms/loanch.json

QA:
- Loanch Rima.xlsx patikrintas su esamu import_loanch.py: OK.
- Nuskaityta 9 paskolos; aktyvių 2; užbaigtų 7.
- Investavimas Rima.xlsx patikrintas su dinaminiu Rimos Dashboard importeriu: OK.
