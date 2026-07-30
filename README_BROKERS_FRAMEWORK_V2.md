# Common Import Framework V2 – visi brokeriai

Ši versija perkelia visus šešis brokerių / fondų / robo importerius į:

```text
scripts/brokers/
```

Perkeliami:

- SEB Mikro
- SEB Fondai
- SEB Robo
- Revolut Brokerage
- Revolut Robo
- Synergy

## Svarbi migracijos strategija

`Synergy` jau visiškai perrašytas ant naujo `BrokerImporter`.

Kiti penki importeriai šiame etape naudoja `LegacyBrokerAdapter`.
Tai sąmoningas saugus tarpinis žingsnis:

- naujas Framework valdo paleidimą;
- naujas Framework valdo JSON įrašymą;
- naujas Framework atlieka bendrą validaciją;
- veikianti Excel skaičiavimo logika dar neperrašoma vienu metu.

Taip išvengiame rizikos pakeisti penkis veikiančius skaičiavimus vienu kartu.

## Prieš kopijuojant

Projekto `scripts` kataloge turi likti seni veikiantys failai:

```text
scripts/import_seb_mikro.py
scripts/import_seb_fondai.py
scripts/import_seb_robo.py
scripts/import_revolut_brokerage.py
scripts/import_revolut_robo.py
```

Naujieji failai jų dar nepakeičia – jie juos saugiai kviečia per adapterį.

## Kopijavimas

ZIP turinį išarchyvuokite į projekto šaknį ir leiskite perrašyti
ankstesnius Framework failus.

## Paleidimas

Visi brokeriai vienu kartu:

```powershell
python scripts/run_all_importers.py
```

Po to:

```powershell
python scripts/build_portfolio.py
```

Atskiras brokeris:

```powershell
python -m scripts.brokers.import_seb_mikro
python -m scripts.brokers.import_seb_fondai
python -m scripts.brokers.import_seb_robo
python -m scripts.brokers.import_revolut_brokerage
python -m scripts.brokers.import_revolut_robo
python -m scripts.brokers.import_synergy
```

## Revolut Brokerage

Kadangi visas Revolut Brokerage portfelis parduotas, naujas adapteris
priverstinai nustato:

```text
activeInvestments = 0
completedInvestments = visos pozicijos
invested = 0
currentValue = 0
cash = 0
```

Istorinė įnešta suma išsaugoma kaip `totalContributed`, o paskutinis
užfiksuotas pelnas kaip `realizedProfit`.

## Kitas etapas

Kai patvirtinsime, kad visi šeši brokeriai generuoja teisingą portfelį,
po vieną perkelsime jų vidinę Excel logiką iš senų failų į bendrą
`BrokerImporter`. Tada senus šakninius brokerių importerius bus galima
pašalinti.
