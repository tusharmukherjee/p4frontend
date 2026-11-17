import { useEffect, useState } from "react";
import { upstoxApi } from "./api";
import type { Credentials } from "./types";

export function UpstoxTokenSettings({ credentials }: { credentials: Credentials }) {
  const [configured, setConfigured] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    upstoxApi.tokenStatus(credentials)
      .then((status) => { if (active) setConfigured(status.configured); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to check Upstox token"); });
    return () => { active = false; };
  }, [credentials]);

  const save = async () => {
    setBusy(true); setError("");
    try {
      await upstoxApi.saveToken(credentials, token);
      setToken(""); setConfigured(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save Upstox token");
    } finally { setBusy(false); }
  };

  return <section className="football-token-panel">
    <div>
      <p className="eyebrow">MARKET DATA INTEGRATION</p>
      <h2>Upstox bearer token</h2>
      <p>{configured
        ? "Token saved with AES-256-GCM encryption in the database. Enter a new token to replace it."
        : "Save an Upstox access token to load index quotes and calculate market insights."}</p>
      {error && <small className="field-error">{error}</small>}
    </div>
    <div className="football-token">
      <label>Bearer token<input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder={configured ? "Enter replacement token" : "Paste Upstox bearer token"} /></label>
      <button className="button secondary" type="button" disabled={busy || !token.trim()} onClick={save}>{busy ? "Validating…" : "Save token"}</button>
    </div>
  </section>;
}
