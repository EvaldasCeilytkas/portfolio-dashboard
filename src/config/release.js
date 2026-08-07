export const RELEASE = Object.freeze({
  product: "Portfolio Dashboard Pro",
  version: "2.5.4",
  label: "v2.5.4",
  channel: "Stable",
  build: "2026.08.07",
  buildNumber: "2.5.4",
  designSystem: "2.0.3",
  schema: 1,
  copyrightYear: 2026,
});

export const CHANGELOG = Object.freeze([
  {
    version: "2.5.4",
    date: "2026-08-07",
    title: "Auto Platform Engine",
    items: [
      "Vienas platformų registras React ir Python importeriams.",
      "Platformų priklausomybė savininkams valdoma per platforms.json.",
      "Rimos platformų importas generuojamas automatiškai iš registro.",
      "P2P puslapio platformų sąrašai nebeįrašyti rankiniu būdu.",
      "Naujų platformų prijungimui sumažintas keičiamų failų skaičius.",
    ],
  },
  {
    version: "2.0 FINAL",
    date: "2026-08-02",
    title: "Official Stable Release",
    items: [
      "Portfolio Dashboard Pro paskelbtas stabilia v2.0 versija.",
      "Užbaigtas Stable branding ir System Info leidimo centras.",
      "Diagnostikos būsenos suvienodintos į Healthy / Issue.",
      "Papildytas galutinio leidimo kontrolinis sąrašas.",
      "Pridėta galutinė leidimo dokumentacija ir versijos metaduomenys.",
    ],
  },
  {
    version: "2.0 RC1",
    date: "2026-08-02",
    title: "Release Candidate",
    items: [
      "Pridėtas System Info ir Diagnostics centras.",
      "Pridėtas konfigūracijos atsarginės kopijos eksportas.",
      "Maršrutai pradėti krauti pagal poreikį su React.lazy.",
      "Pridėta bendra klaidų gaudyklė ir RC būsenos indikatoriai.",
    ],
  },
  {
    version: "1.9",
    date: "2026-08-02",
    title: "AI ir ataskaitos",
    items: ["AI Insights v1.0", "Report Center v1.0", "Search Center v1.0"],
  },
  {
    version: "1.8",
    date: "2026-08-02",
    title: "Design System",
    items: ["Design System v2.0.3", "Motion & Polish", "Bendri UI komponentai"],
  },
  {
    version: "1.7",
    date: "2026-08-02",
    title: "Multi Portfolio ir Sync",
    items: ["Evaldas, Rima, Gerda ir Šeima", "Sync Center v1.1", "Vienas atnaujinimo BAT"],
  },
]);
