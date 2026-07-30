export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatCurrency(value, currency = "EUR") {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export function formatPercentage(value) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value))} %`;
}

export function formatInteger(value) {
  return new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 0 }).format(toNumber(value));
}

export function formatDateTime(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function formatChartDate(value) {
  if (!value) return "–";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("lt-LT", { year: "2-digit", month: "short" }).format(date);
}

export function getPlatformValue(platform) {
  return toNumber(platform?.currentValue ?? platform?.value ?? platform?.summary?.currentValue ?? platform?.summary?.value);
}

export function getPlatformInvested(platform) {
  return toNumber(platform?.invested ?? platform?.investedAmount ?? platform?.summary?.invested);
}

export function isPlatformActive(platform) {
  if (typeof platform?.active === "boolean") return platform.active;
  const status = String(platform?.status ?? "").trim().toLocaleLowerCase("lt-LT");
  if (["inactive", "closed", "completed", "finished", "archived", "neaktyvi", "uždaryta", "uzdaryta", "archyvuota"].includes(status)) return false;
  return getPlatformValue(platform) > 0 || getPlatformInvested(platform) > 0;
}

export function getPlatformName(platform) {
  return platform?.name ?? platform?.platformName ?? platform?.title ?? "Nežinoma platforma";
}

export function getAssetClass(platform) {
  return platform?.assetClass ?? platform?.group ?? platform?.type ?? platform?.category ?? "Kita";
}

const labels = {
  brokerage: "Brokeriai", broker: "Brokeriai", stocks: "Brokeriai", etf: "Brokeriai",
  p2p: "P2P", real_estate: "NT", realestate: "NT", nt: "NT",
  fund: "Fondai", funds: "Fondai", fondai: "Fondai", robo: "Robo", robo_advisor: "Robo",
};

export function getAssetClassLabel(value) {
  const key = String(value ?? "").trim().toLocaleLowerCase("lt-LT").replaceAll("-", "_").replaceAll(" ", "_");
  return labels[key] ?? (String(value ?? "").trim() || "Kita");
}
