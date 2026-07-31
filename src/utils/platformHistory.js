function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toISOString().slice(0, 10);
}

function monthKey(value) {
  const normalized = normalizeDate(value);
  return normalized ? normalized.slice(0, 7) : "";
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("lt-LT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePoint(item) {
  const invested = toNumber(item?.invested ?? item?.contributed ?? item?.capital);
  const value = toNumber(item?.value ?? item?.currentValue ?? item?.portfolioValue);
  const profit = toNumber(item?.profit, value - invested);
  return {
    ...item,
    date: normalizeDate(item?.date ?? item?.month ?? item?.period),
    invested,
    value,
    profit,
    returnRate: toNumber(
      item?.returnRate ?? item?.return ?? item?.roi,
      invested > 0 ? (profit / invested) * 100 : 0,
    ),
  };
}

export function findPlatformHistory(historyPayload, platformSlug, platformName) {
  const platforms = historyPayload?.platforms || {};
  const wantedSlug = normalizeSlug(platformSlug);
  const wantedName = normalizeSlug(platformName);

  let entry = platforms[wantedSlug];
  if (!entry && wantedName) {
    entry = Object.values(platforms).find(
      (item) => normalizeSlug(item?.name) === wantedName,
    );
  }

  return (Array.isArray(entry?.history) ? entry.history : [])
    .map(normalizePoint)
    .filter((item) => item.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildPlatformChartHistory(historicalHistory, platformPayload) {
  const summary = platformPayload?.summary || {};
  const latestMonth = platformPayload?.latestMonth || {};
  const platform = platformPayload?.platform || {};

  const result = (Array.isArray(historicalHistory) ? historicalHistory : [])
    .map(normalizePoint)
    .filter((item) => item.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const currentDate = normalizeDate(
    latestMonth?.date ?? platform?.updatedAt ?? platformPayload?.generatedAt,
  );
  const currentMonth = monthKey(currentDate);
  if (!currentMonth) return result;

  if (result.some((item) => monthKey(item.date) === currentMonth)) {
    return result;
  }

  // Einamojo mėnesio grafiko taškui platformos latestMonth yra
  // autoritetingas šaltinis. Tai ypač svarbu Indemo, kur:
  // - summary.invested reiškia aktyviai paskirstytą kapitalą;
  // - latestMonth.invested reiškia gryną įneštą kapitalą.
  const invested = toNumber(
    latestMonth?.invested ??
      latestMonth?.deposited ??
      summary?.deposited ??
      summary?.invested,
  );
  const value = toNumber(
    latestMonth?.value ??
      latestMonth?.currentValue ??
      summary?.currentValue,
  );
  const profit = toNumber(
    latestMonth?.profit ?? summary?.profit,
    value - invested,
  );

  result.push({
    date: currentDate,
    invested,
    value,
    profit,
    returnRate: toNumber(
      latestMonth?.returnRate ??
        latestMonth?.monthlyReturn ??
        summary?.returnRate ??
        summary?.roi,
      invested > 0 ? (profit / invested) * 100 : 0,
    ),
    source: "platform-json",
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}
