# RC1 testų suvestinė

## Statinės patikros

- Maršrutai: sujungti.
- System Info navigacija: pridėta.
- Backup eksportas: naršyklės JSON download mechanizmas.
- Diagnostics: tikrina pagrindinius JSON šaltinius.
- Multi Portfolio kontekstas: nekeistas.
- Excel importerių logika: nekeista.
- GitHub Pages base: `/portfolio-dashboard/`.

## Naudotojo patikra po diegimo

1. Paleisti `npm run dev` arba esamą BAT.
2. Atidaryti Dashboard ir persijungti tarp 4 portfelių.
3. Patikrinti Search, Reports, AI Insights ir Sync.
4. Atidaryti System Info.
5. Paleisti Diagnostics.
6. Atsisiųsti Backup JSON.
7. Paleisti bendrą portfelių BAT ir patikrinti GitHub Pages.

Pastaba: pilnas `npm run build` šiame paruošime nebuvo vykdomas, nes vartotojas nepateikė šakninio `package.json` ir `package-lock.json`.
