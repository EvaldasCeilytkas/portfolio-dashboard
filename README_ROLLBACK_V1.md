# Grįžimas į saugią Common Framework V1 būseną

Šis paketas grąžina būseną, kurioje:

- naują Common Framework naudoja tik `Synergy`;
- kiti brokeriai lieka su senais veikiančiais importeriais;
- pašalinamas `LegacyBrokerAdapter`;
- `build_portfolio.py` vėl turi generuoti ankstesnius teisingus portfelio skaičius.

## Veiksmai

1. ZIP turinį išarchyvuokite į projekto šaknį ir leiskite perrašyti failus.
2. Projekto šaknyje paleiskite:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/rollback_framework_v1.ps1
```

3. Tada paleiskite:

```powershell
python scripts/build_portfolio.py
```

Tikėtinas ankstesnis rezultatas:

```text
Platformų: 21
Investuota: 11647.97 EUR
Vertė: 12665.33 EUR
Pelnas: 1559.71 EUR
Aktyvių investicijų: 204
Vėluojančių: 11
Užbaigtų: 145
```
