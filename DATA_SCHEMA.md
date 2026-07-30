# Portfolio V2 platformos duomenų schema

## Statusas

```text
V2.2.1 — PATVIRTINTA
Schema version: 1
```

Ši schema yra vienintelis standartas visiems platformų JSON failams.

## Pagrindinė struktūra

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-07-29T19:30:00+03:00",
  "platform": {},
  "summary": {},
  "history": [],
  "investments": []
}
```

## Principai

### 1. `platform`

Aprašo platformos tapatybę, o ne finansinius rezultatus.

`platform.id` ir `platform.slug` turi sutapti.

### 2. `summary`

Saugo aktualią platformos suvestinę.

```text
invested
currentValue
profit
returnRate
xirr
cash
incomeReceived
activeInvestments
delayedInvestments
completedInvestments
averageRate
averageLtv
```

`returnRate`, `xirr`, `averageRate` ir `averageLtv` gali būti `null`, kai
rodiklis konkrečiai platformai netaikomas arba jo neįmanoma patikimai
apskaičiuoti.

### 3. `history`

Visos platformos naudoja tik vieną istorijos masyvą:

```text
history
```

Vieno įrašo laukai:

```text
date
invested
value
profit
cash
income
```

Nenaudojame:

```text
monthlyHistory
valueHistory
portfolioHistory
```

### 4. `investments`

Visų tipų platformose sąrašas vadinasi vienodai:

```text
investments
```

Bendri privalomi investicijos laukai:

```text
id
code
name
investmentType
status
currency
invested
currentValue
profit
investmentDate
```

Navigacijai naudojamas tik:

```text
code
```

`id` turi sutapti su `code`.

## Investicijų tipai

```text
fund
stock
etf
loan
real_estate_project
npl_asset
robo_portfolio
other
```

## Statusai

```text
active
delayed
completed
sold
written_off
```

## Papildomi laukai

Skirtingi investicijų tipai gali turėti papildomus laukus, pavyzdžiui:

```text
interestRate
ltv
delayDays
rating
maturityDate
quantity
averagePrice
marketPrice
ticker
isin
payments
```

Viršutinė JSON struktūra išlieka vienoda, tačiau `investments` elementams
leidžiami platformos tipui reikalingi papildomi laukai.

## Skaičiavimo taisyklės

```text
summary.profit = summary.currentValue - summary.invested
```

Ši lygybė taikoma tada, kai `invested` reiškia dar neatgautą kapitalą ir
platformos modelis neturi papildomos apskaitos specifikos.

Platformose, kur pelnas apima jau išmokėtas pajamas, importeris privalo
naudoti realią platformos apskaitos logiką ir jos nekeisti vien dėl bendros
formulės.

```text
returnRate = profit / invested × 100
```

Kai `invested` yra 0, `returnRate` turi būti `null`.

Visos piniginės reikšmės saugomos kaip skaičiai, ne kaip suformatuotas tekstas.

Teisingai:

```json
"currentValue": 1050.25
```

Neteisingai:

```json
"currentValue": "1 050,25 €"
```

## Datos

Kalendorinės datos:

```text
YYYY-MM-DD
```

Generavimo laikas:

```text
ISO 8601 date-time
```

## Valiuta

V2 pirmame etape visų duomenų bazinė valiuta:

```text
EUR
```

## Failų vieta

Realūs platformų failai:

```text
public/data/platforms/<platform-slug>.json
```

Pavyzdys:

```text
public/data/platforms/crowdpear.json
```

## Schemos keitimas

Esamos `schemaVersion: 1` struktūros tyliai nekeičiame.

Jeigu ateityje reikės nesuderinamo pakeitimo:

```text
schemaVersion: 2
```

ir paruošiama aiški migracija.
