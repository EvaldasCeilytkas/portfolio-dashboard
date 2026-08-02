import { useEffect, useMemo, useState } from "react";

function parseDisplayValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { number: value, prefix: "", suffix: "", decimals: Number.isInteger(value) ? 0 : 2 };
  }
  if (typeof value !== "string") return null;
  const match = value.match(/-?[\d\s.]+(?:,[\d]+)?/);
  if (!match) return null;
  const raw = match[0];
  const normalized = raw.replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const number = Number(normalized);
  if (!Number.isFinite(number)) return null;
  const comma = raw.lastIndexOf(",");
  const decimals = comma >= 0 ? raw.length - comma - 1 : 0;
  return {
    number,
    prefix: value.slice(0, match.index),
    suffix: value.slice((match.index || 0) + raw.length),
    decimals: Math.min(2, Math.max(0, decimals)),
  };
}

export default function AnimatedValue({ value, duration = 650 }) {
  const parsed = useMemo(() => parseDisplayValue(value), [value]);
  const [display, setDisplay] = useState(parsed?.number ?? value);

  useEffect(() => {
    if (!parsed || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(parsed?.number ?? value);
      return undefined;
    }
    let frame;
    const started = performance.now();
    const target = parsed.number;
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [parsed, value, duration]);

  if (!parsed) return value;
  const formatted = new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  }).format(Number(display) || 0);
  return `${parsed.prefix}${formatted}${parsed.suffix}`;
}
