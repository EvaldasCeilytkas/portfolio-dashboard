# Portfolio Dashboard Pro v2.0 FINAL — Performance Audit

## Atlikti pakeitimai

### JSON užklausų talpykla
- Pridėtas `src/services/jsonClient.js`.
- Vienodos užklausos sujungiamos į vieną vykdomą užklausą.
- Atsakymai saugomi naršyklės atmintyje 60 sekundžių.
- Talpykla išvaloma perkrovus puslapį, todėl po Sync pakanka įprasto puslapio atnaujinimo.
- Išsaugotas `AbortSignal` palaikymas komponentų gyvavimo ciklui.

### Sumažintas pakartotinis JSON skaitymas
Bendrą klientą dabar naudoja:
- Dashboard istorijos duomenys;
- Reports duomenys;
- Search indeksas;
- Portfolio platformų tarnyba;
- Analytics istorijos duomenys.

Tai sumažina pasikartojančias platformų ir istorijos failų užklausas pereinant tarp modulių.

### Maršrutų įkėlimas
- `React.lazy()` išsaugotas visiems puslapiams.
- `Suspense` perkeltas į `AppLayout` turinio zoną.
- Keičiant puslapį Sidebar ir TopBar lieka ekrane, kraunamas tik puslapio turinys.

### Skaičiavimų optimizavimas
- Šeimos istorijos sujungime pašalintos pasikartojančios `Array.find()` paieškos.
- Naudojami `Map`, todėl datos ieškomos pastoviu laiku.
- Search Center naudoja `useDeferredValue`, kad rašymas į paieškos lauką išliktų sklandus ir didėjant indeksui.
- Valiutos formatteris Search Center kuriamas vieną kartą, o ne kiekvienai eilutei.

### React Context stabilumas
- `selectOwner` stabilizuotas su `useCallback`.
- Portfelių sąrašas sukuriamas vieną kartą.
- Context reikšmė nebekinta be realaus savininko pakeitimo.

## Nepakeista
- UI ir Design System išvaizda;
- portfelių skaičiavimo logika;
- JSON formatas;
- importavimo skriptai;
- BAT ir Sync procesas;
- maršrutų adresai.

## Patikra
- Naujo JSON kliento JavaScript sintaksė patikrinta su `node --check`.
- Pilnas `npm run build` šiame konteineryje neatliktas, nes vidinis NPM registras nepateikia projekto React ir ESLint paketų.
- Pakeitimai atlikti ant veikiančios v2.0 FINAL UI Polish versijos.
