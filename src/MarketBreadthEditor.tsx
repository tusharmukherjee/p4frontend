import { useEffect, useMemo, useState } from "react";
import { marketApi, type MarketIndexOption } from "./api";
import type { Credentials, DashboardModule } from "./types";

const MAX_SELECTED = 20;

export function MarketBreadthEditor({ credentials, module, onChange }: {
  credentials: Credentials;
  module: DashboardModule;
  onChange: (next: DashboardModule) => void;
}) {
  const selected = Array.isArray(module.payload?.instrumentKeys)
    ? module.payload.instrumentKeys.filter((item): item is string => typeof item === "string")
    : [];
  const momentumMinutes = module.payload?.momentumMinutes === 15 ? 15 : 5;
  const [options, setOptions] = useState<MarketIndexOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    marketApi.indices(credentials)
      .then((result) => { if (active) { setOptions(result.indices); setError(""); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load market indices"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [credentials]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((item) =>
      item.name.toLowerCase().includes(needle) ||
      item.symbol.toLowerCase().includes(needle) ||
      item.category?.toLowerCase().includes(needle));
  }, [options, query]);

  const toggle = (instrumentKey: string, checked: boolean) => {
    if (checked && selected.length >= MAX_SELECTED) {
      setError(`Choose at most ${MAX_SELECTED} indices.`);
      return;
    }
    const instrumentKeys = checked
      ? [...selected, instrumentKey]
      : selected.filter((item) => item !== instrumentKey);
    setError("");
    onChange({ ...module, payload: { ...module.payload, instrumentKeys } });
  };

  return <fieldset className="market-editor">
    <legend>Market insights</legend>
    <p>Choose Upstox index instruments for momentum and range analysis. Select both NIFTY 50 and NIFTY BANK to calculate relative strength.</p>
    <label className="market-search">Momentum window<select value={momentumMinutes} onChange={(event) => onChange({ ...module, payload: { ...module.payload, momentumMinutes: Number(event.target.value) } })}><option value={5}>5 minutes</option><option value={15}>15 minutes</option></select></label>
    <label className="market-search">Find an index<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="NIFTY 50, BANK, MIDCAP…" /></label>
    <div className="market-selection-summary"><strong>{selected.length}</strong> / {MAX_SELECTED} selected</div>
    <div className="market-index-list">
      {loading && <span className="market-empty">Loading indices…</span>}
      {!loading && filtered.length === 0 && <span className="market-empty">No matching indices</span>}
      {filtered.map((item) => <label key={item.instrumentKey} title={item.category ?? undefined}>
        <input type="checkbox" checked={selected.includes(item.instrumentKey)} onChange={(event) => toggle(item.instrumentKey, event.target.checked)} />
        <span><strong>{item.name}</strong><small>{item.category ?? item.symbol}</small></span>
      </label>)}
    </div>
    {selected.length === 0 && <small className="field-error">Select at least one index before saving.</small>}
    {error && <small className="field-error">{error}</small>}
  </fieldset>;
}
