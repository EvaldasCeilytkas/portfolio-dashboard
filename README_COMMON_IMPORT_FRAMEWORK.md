# Common Import Framework – 1 etapas

Šis paketas įveda bendrą importerių branduolį nekeičiant esamo
`build_portfolio.py`.

## Įdėjimas

Nukopijuokite:

```text
scripts/common/
scripts/brokers/
scripts/run_all_importers.py
```

į projekto šaknį.

Kad veiktų importai `from scripts.common...`, projekto šaknyje turi būti:

```text
scripts/__init__.py
```

Jeigu jo nėra, sukurkite tuščią failą.

## Bandomasis importeris

Pirmiausia paleiskite:

```powershell
python -m scripts.brokers.import_synergy
```

Jis turi sukurti:

```text
public/data/platforms/synergy.json
```

Tada paleiskite:

```powershell
python scripts/build_portfolio.py
```

Jeigu bendras portfelio rezultatas nepasikeičia netikėtai, karkasas veikia.

## Svarbu

Šis 1 etapas specialiai nekeičia visų 21 importerių vienu metu.
Pirmiausia saugiai patikrinamas Synergy importeris.

Toliau analogiškai perkeliami:

1. SEB Mikro
2. SEB Fondai
3. SEB Robo
4. Revolut Brokerage
5. Revolut Robo
6. P2P šeima
7. Nekilnojamojo turto šeima

## Struktūra

```text
scripts/
├── common/
│   ├── base_importer.py
│   ├── broker_importer.py
│   ├── excel.py
│   ├── json_writer.py
│   ├── registry.py
│   ├── utils.py
│   └── validation.py
├── brokers/
│   └── import_synergy.py
└── run_all_importers.py
```

## Kodėl migracija etapais

Visų 21 importerių pakeitimas vienu metu sukeltų per didelę riziką.
Senas importeris paliekamas kaip atsarginis, kol naujas duoda identišką JSON.
