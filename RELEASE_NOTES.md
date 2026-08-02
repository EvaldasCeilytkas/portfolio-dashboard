# Portfolio Dashboard Pro v2.0 — Release Notes

## Leidimo būsena

**Stable** — oficialus kasdieniam naudojimui skirtas v2.0 leidimas.

## Svarbiausios galimybės

- Keturi portfelio režimai: Evaldas, Rima, Gerda ir Šeima.
- Excel → Python → JSON → React duomenų srautas.
- Vienas bendras visų portfelių sinchronizavimo BAT failas.
- Dashboard, Portfolio, Analytics, P2P ir išsamūs platformų puslapiai.
- Performance, Alerts, Intelligence, Goals ir Sync centrai.
- Globali paieška, ataskaitos ir AI Insights.
- Design System v2.0.3 su animacijomis ir bendrais UI komponentais.
- System Info, Diagnostics, Backup ir vidinis Changelog.

## Diegimas iš RC1

1. Pakeiskite dabartinį `src` aplanką pateiktu `src` aplanku.
2. Projekto šaknyje pakeiskite `package.json`.
3. `public`, `scripts`, Excel ir BAT failų šiame etape keisti nereikia.
4. Paleiskite `npm run dev` ir patikrinkite `System Info` puslapį.
5. Po patikros paleiskite bendrą BAT failą publikavimui.

## Tikėtinas rezultatas

System Info puslapyje turi būti rodoma:

- `v2.0 FINAL`
- `Release Channel: Stable`
- `SYSTEM HEALTHY`, kai visi diagnostikos šaltiniai pasiekiami
- Build `2026.08.02`

## Žinomi apribojimai

- Naršyklė negali tiesiogiai paleisti Windows BAT failo.
- Backup eksportas neįtraukia Excel ir visų JSON duomenų failų.
- AI Insights v1.0 yra taisyklėmis paremta vietinė analizė, nenaudojanti išorinio AI API.
