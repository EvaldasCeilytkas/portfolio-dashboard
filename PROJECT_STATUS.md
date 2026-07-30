# Portfolio V2 būklė

## Užbaigta

### V2.0 — Projekto karkasas

React, maršrutai ir bendras puslapio karkasas.

### V2.1 — Platformų registras

21 platforma ir vienas bendras registras React bei Python dalims.

### V2.2.1 — Vieninga platformos JSON schema

Patvirtinta `schemaVersion: 1` struktūra ir jos validacija.

### V2.2.2 — Realus Crowdpear JSON

Sukurtas migravimo įrankis, kuris:

- paima realų seno projekto Crowdpear JSON;
- pašalina testinį projektą;
- konvertuoja projektus į `investments`;
- konvertuoja realiai gautus mokėjimus;
- perskaičiuoja projektų statusų kiekius;
- sukuria `public/data/platforms/crowdpear.json`;
- patikrina rezultatą pagal V2.2.1 schemą.

## Kitas žingsnis

### V2.2.3 — Crowdpear Excel importeris

Rašomas naujas `import_crowdpear.py`, kuris tą patį V2 failą generuos
tiesiogiai iš `Crowdpear.xlsx`, nebenaudodamas seno JSON.
