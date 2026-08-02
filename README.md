# Portfolio Dashboard Pro v2.0

Portfolio Dashboard Pro yra kelių portfelių investicijų valdymo sistema, sujungianti Excel importus, React sąsają, analitiką, tikslus, paiešką, ataskaitas, AI įžvalgas ir sinchronizavimo diagnostiką.

## Leidimas

- Versija: **2.0**
- Kanalo tipas: **Stable**
- Build: **2026.08.02**
- Design System: **2.0.3**

## Pagrindiniai moduliai

- Dashboard
- Portfolio
- Analytics
- P2P ir platformų puslapiai
- Performance Center
- Alerts Center
- Portfolio Intelligence
- Goals Center
- Sync Center
- Search Center
- Report Center
- AI Insights
- System Info ir Diagnostics

## Portfeliai

Sistema palaiko Evaldo, Rimos, Gerdos ir bendrą šeimos portfelį. Gerdos portfelis nėra įtraukiamas į šeimos sumas.

## Paleidimas lokaliai

```bash
npm install
npm run dev
```

## Produkcinis build

```bash
npm run build
npm run preview
```

GitHub Pages bazinis kelias nustatytas `vite.config.js` faile: `/portfolio-dashboard/`.

## Duomenų atnaujinimas

Pagrindiniame projekto aplanke paleiskite:

```text
ATNAUJINTI_VISUS_PORTFELIUS.bat
```

Jis atnaujina visų portfelių JSON, Sync Center būseną ir publikuoja pakeitimus.

## Duomenų saugumas

System Info puslapio Backup funkcija eksportuoja naršyklės nustatymus ir Goals konfigūraciją. Excel bei sugeneruoti JSON failai lieka projekto aplankuose ir turi būti saugomi atskirai.
