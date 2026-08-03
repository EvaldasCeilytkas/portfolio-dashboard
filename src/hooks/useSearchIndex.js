import { useEffect, useMemo, useState } from "react";
import { requestJson } from "../services/jsonClient";

const OWNER_SOURCES = [
  {
    id: "evaldas",
    name: "Evaldas",
    folder: "",
    platforms: [
      "afranga", "crowdpear", "debitum", "income", "indemo", "lande",
      "lendermarket", "loanch", "nectaro", "nordstreet", "peerberry",
      "profitus", "revolut-brokerage", "revolut-robo", "rontgen", "scramble",
      "seb-fondai", "seb-mikro", "seb-robo", "synergy", "viainvest",
    ],
  },
  {
    id: "rima",
    name: "Rima",
    folder: "rima/",
    platforms: [
      "indemo", "lendermarket", "nordstreet", "profitus",
      "revolut-brokerage", "scramble", "seb-fondai",
    ],
  },
  {
    id: "gerda",
    name: "Gerda",
    folder: "gerda/",
    platforms: ["profitus"],
  },
];

const text = (...values) => values.filter(Boolean).join(" ").toLocaleLowerCase("lt-LT");

function investmentKind(platform, investment) {
  const group = platform?.group;
  const type = platform?.type;
  if (group === "real_estate" || type === "real_estate") return "project";
  if (group === "brokerage" || type === "brokerage") return "position";
  if (group === "funds" || type === "funds") return "fund";
  if (group === "robo" || type === "robo-advisor") return "position";
  if (type === "indemo") return "project";
  return "loan";
}

function itemPath(platform, investment, kind) {
  const platformSlug = platform.slug || platform.id;
  if (kind === "project") {
    const code = investment.code || investment.loanCode || investment.id || investment.slug;
    return `/platforms/${platformSlug}/projects/${encodeURIComponent(code)}`;
  }
  if (kind === "loan") {
    const id = investment.slug || investment.id || investment.loanCode;
    return `/platforms/${platformSlug}/loan/${encodeURIComponent(id)}`;
  }
  const code = investment.slug || investment.id || investment.ticker || investment.isin;
  return code
    ? `/platforms/${platformSlug}/projects/${encodeURIComponent(code)}`
    : `/platforms/${platformSlug}`;
}

function buildItems(owner, payload, slug) {
  const platform = payload?.platform || { slug, id: slug, name: slug };
  const summary = payload?.summary || {};
  const items = [
    {
      id: `${owner.id}:platform:${slug}`,
      ownerId: owner.id,
      ownerName: owner.name,
      type: "platform",
      typeLabel: "Platforma",
      title: platform.name || slug,
      subtitle: platform.category || "Investavimo platforma",
      status: platform.active === false ? "inactive" : "active",
      value: Number(summary.currentValue) || 0,
      path: `/platforms/${platform.slug || slug}`,
      searchText: text(platform.name, platform.slug, platform.category, platform.group, platform.type),
    },
  ];

  const investments = Array.isArray(payload?.investments) ? payload.investments : [];
  for (const investment of investments) {
    const kind = investmentKind(platform, investment);
    const title = investment.name || investment.fullName || investment.loanCode || investment.code || investment.ticker || investment.id;
    if (!title) continue;
    const code = investment.ticker || investment.isin || investment.loanCode || investment.code || investment.id || "";
    const subtitleParts = [platform.name, code && code !== title ? code : "", investment.country, investment.lender].filter(Boolean);
    items.push({
      id: `${owner.id}:${slug}:${investment.id || investment.slug || investment.code || title}`,
      ownerId: owner.id,
      ownerName: owner.name,
      platformSlug: platform.slug || slug,
      platformName: platform.name || slug,
      type: kind,
      typeLabel: kind === "project" ? "Projektas" : kind === "loan" ? "Paskola" : kind === "fund" ? "Fondas" : "Pozicija",
      title,
      subtitle: subtitleParts.join(" · "),
      status: investment.status || "active",
      value: Number(investment.currentValue ?? investment.outstanding ?? investment.invested) || 0,
      path: itemPath(platform, investment, kind),
      searchText: text(
        title, code, investment.fullName, investment.ticker, investment.isin,
        investment.country, investment.lender, investment.loanType,
        platform.name, platform.slug, investment.status,
      ),
    });
  }

  return items;
}

export default function useSearchIndex() {
  const [state, setState] = useState({ loading: true, items: [], errors: [] });

  useEffect(() => {
    const controller = new AbortController();
    const base = `${import.meta.env.BASE_URL}data/`;

    async function load() {
      const items = [];
      const errors = [];
      await Promise.all(
        OWNER_SOURCES.flatMap((owner) =>
          owner.platforms.map(async (slug) => {
            try {
              const payload = await requestJson(
                `${base}${owner.folder}platforms/${slug}.json`,
                { signal: controller.signal },
              );
              items.push(...buildItems(owner, payload, slug));
            } catch (error) {
              if (error?.name !== "AbortError") errors.push(`${owner.name}: ${slug}`);
            }
          }),
        ),
      );
      if (!controller.signal.aborted) {
        setState({ loading: false, items, errors });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const counts = useMemo(() => {
    const result = { all: state.items.length };
    for (const item of state.items) result[item.type] = (result[item.type] || 0) + 1;
    return result;
  }, [state.items]);

  return { ...state, counts };
}
