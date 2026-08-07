V2.5.4.2 RIMA LOANCH HOTFIX
===========================

Pakeisti failus išlaikant katalogų struktūrą:
- src/pages/P2PPage.jsx
- src/pages/AnalyticsPage.jsx
- src/data/platforms.json
- scripts/import_rima_portfolio.py
- scripts/import_rima_dashboard.py
- public/data/rima/platforms/loanch.json

Tada paleisti įprastą ATNAUJINTI_VISUS_PORTFELIUS.bat.

Kas pataisyta:
1. Loanch įtrauktas į Rimos registrą.
2. Pridedamas realiai sugeneruotas Rimos Loanch JSON.
3. P2P puslapis nebenuvirsta, jei vienos platformos JSON trūksta arba grįžta HTML fallback.
4. Analytics saugiai naudoja history paskutinį tašką, jei latest nėra.
5. Rimos dashboard importeris išlaiko teisingą history/latest JSON formatą ir dinamiškai randa Excel suvestinių stulpelius.
