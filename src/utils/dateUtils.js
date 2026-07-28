const LITHUANIAN_MONTHS = [
  "sausis",
  "vasaris",
  "kovas",
  "balandis",
  "gegužė",
  "birželis",
  "liepa",
  "rugpjūtis",
  "rugsėjis",
  "spalis",
  "lapkritis",
  "gruodis",
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseDateParts(value) {
  const text = String(value || "").trim();

  if (!text) return null;

  const match = text.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3] || 1);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { year, month, day };
}

/**
 * Grąžina ataskaitinio mėnesio raktą YYYY-MM.
 *
 * Projekto Excel importeriai naudoja dvi mėnesio datos konvencijas:
 * - paskutinę ataskaitinio mėnesio dieną, pvz. 2026-06-30;
 * - pirmą kito mėnesio dieną, pvz. 2026-07-01.
 *
 * Todėl pirmoji mėnesio diena priskiriama ankstesniam ataskaitiniam mėnesiui.
 */
export function monthKey(value) {
  const parts = parseDateParts(value);

  if (!parts) return "";

  let { year, month, day } = parts;

  if (day === 1) {
    month -= 1;

    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return `${year}-${pad(month)}`;
}

export function normalizeMonth(value) {
  const key = monthKey(value);
  return key ? `${key}-01` : "";
}

export function compareMonth(left, right) {
  return monthKey(left).localeCompare(monthKey(right));
}

export function formatMonth(value, locale = "lt-LT") {
  const key = monthKey(value);

  if (!key) return "–";

  const [yearText, monthText] = key.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return key;
  }

  if (locale === "lt-LT") {
    return `${year} m. ${LITHUANIAN_MONTHS[monthIndex]}`;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

export function formatFullDate(value, locale = "lt-LT") {
  if (!value) return "–";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
