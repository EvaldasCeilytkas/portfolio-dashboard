# Common Import Framework V2.1 pataisymas

Pataisyta SEB Mikro migracijos klaida:

- `LegacyBrokerAdapter` dabar prideda trūkstamą `totalContributed`;
- bendroji validacija atsižvelgia į `custodyFees` / laikymo mokestį;
- `run_all_importers.py` galima paleisti abiem būdais:

```powershell
python scripts/run_all_importers.py
```

arba

```powershell
python -m scripts.run_all_importers
```

## Įdiegimas

ZIP turinį išarchyvuokite į projekto šaknį ir leiskite perrašyti failus.

Tada paleiskite:

```powershell
python scripts/run_all_importers.py
python scripts/build_portfolio.py
```
