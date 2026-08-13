const PLATFORM_THEMES = {
  debitum: { logo: "D" },
  afranga: { logo: "A" },
  income: { logo: "I" },
  lande: { logo: "L" },
  lendermarket: { logo: "LM" },
  loanch: { logo: "LC" },
  nectaro: { logo: "N" },
  peerberry: { logo: "P" },
  twino: { logo: "T" },
  scramble: { logo: "S" },
  viainvest: { logo: "V" },
};

function initials(name) {
  const words = String(name || "P2P")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "P";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function getP2PPlatformTheme(slug, name) {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  return PLATFORM_THEMES[normalizedSlug] || { logo: initials(name) };
}
