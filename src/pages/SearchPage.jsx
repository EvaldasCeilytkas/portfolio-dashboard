import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useSearchIndex from "../hooks/useSearchIndex";
import { usePortfolioOwner } from "../context/PortfolioContext";
import Skeleton from "../components/ui/Skeleton";
import "../styles/search-center.css";

const TYPE_FILTERS = [
  ["all", "Visi"], ["platform", "Platformos"], ["loan", "Paskolos"],
  ["project", "Projektai"], ["position", "ETF / pozicijos"], ["fund", "Fondai"],
];
const OWNER_FILTERS = [["all", "Visi portfeliai"], ["evaldas", "Evaldas"], ["rima", "Rima"], ["gerda", "Gerda"]];
const moneyFormatter = new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const money = (value) => moneyFormatter.format(Number(value) || 0);
const normalize = (value) => String(value || "").trim().toLocaleLowerCase("lt-LT");

function scoreItem(item, query) {
  if (!query) return item.type === "platform" ? 2 : 1;
  const title = normalize(item.title);
  const search = item.searchText || "";
  if (title === query) return 100;
  if (title.startsWith(query)) return 70;
  if (title.includes(query)) return 50;
  if (search.includes(query)) return 25;
  const tokens = query.split(/\s+/).filter(Boolean);
  return tokens.every((token) => search.includes(token)) ? 15 : 0;
}

function SearchPage() {
  const { items, loading, errors, counts } = useSearchIndex();
  const { selectOwner } = usePortfolioOwner();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [type, setType] = useState("all");
  const [owner, setOwner] = useState("all");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef(null);

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (query.trim()) next.set("q", query.trim()); else next.delete("q");
      setParams(next, { replace: true });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const q = normalize(deferredQuery);
    return items
      .map((item) => ({ item, score: scoreItem(item, q) }))
      .filter(({ item, score }) => score > 0 && (type === "all" || item.type === type) && (owner === "all" || item.ownerId === owner))
      .sort((a, b) => b.score - a.score || b.item.value - a.item.value)
      .slice(0, 120)
      .map(({ item }) => item);
  }, [items, deferredQuery, type, owner]);

  function openResult(item) {
    selectOwner(item.ownerId);
    navigate(item.path);
  }

  return (
    <div className="search-center ds-page-enter">
      <section className="search-hero">
        <div>
          <p>GLOBALI PORTFELIO PAIEŠKA</p>
          <h2>Raskite bet kurią investiciją per kelias sekundes</h2>
          <span>Paieška apima Evaldo, Rimos ir Gerdos platformas, paskolas, NT projektus, ETF bei fondus.</span>
        </div>
        <div className="search-index-stat"><strong>{loading ? "…" : items.length}</strong><span>indekso įrašų</span></div>
      </section>

      <section className="search-command-card">
        <div className="search-input-wrap">
          <span aria-hidden="true">⌕</span>
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ieškoti platformos, projekto, paskolos, tickerio ar ISIN…" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Išvalyti paiešką">×</button>}
          <kbd>Ctrl K</kbd>
        </div>
        <div className="search-filter-row">
          <div className="search-filter-group">
            {OWNER_FILTERS.map(([value, label]) => <button key={value} className={owner === value ? "is-active" : ""} onClick={() => setOwner(value)}>{label}</button>)}
          </div>
          <div className="search-filter-group search-type-filters">
            {TYPE_FILTERS.map(([value, label]) => <button key={value} className={type === value ? "is-active" : ""} onClick={() => setType(value)}>{label}{counts[value] ? <small>{counts[value]}</small> : null}</button>)}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="search-skeleton-grid">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} height="88px" />)}</div>
      ) : (
        <section className="search-results-card">
          <header><div><p>PAIEŠKOS REZULTATAI</p><h3>{query ? `Rasta: ${results.length}` : "Visas paieškos indeksas"}</h3></div><span>{errors.length ? `${errors.length} šaltiniai nepasiekiami` : "Indeksas paruoštas"}</span></header>
          {results.length ? (
            <div className="search-results-list">
              {results.map((item) => (
                <button className="search-result-row" key={item.id} type="button" onClick={() => openResult(item)}>
                  <span className={`search-result-icon type-${item.type}`}>{item.type === "platform" ? "PL" : item.type === "project" ? "NT" : item.type === "loan" ? "P2P" : item.type === "fund" ? "F" : "ETF"}</span>
                  <span className="search-result-main"><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                  <span className="search-result-meta"><em>{item.ownerName}</em><b>{item.typeLabel}</b></span>
                  <span className="search-result-value">{money(item.value)}</span>
                  <span className="search-result-arrow">→</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="search-empty"><strong>Rezultatų nerasta</strong><span>Pabandykite trumpesnį pavadinimą, platformos kodą, tickerį arba ISIN.</span></div>
          )}
        </section>
      )}
    </div>
  );
}

export default SearchPage;
