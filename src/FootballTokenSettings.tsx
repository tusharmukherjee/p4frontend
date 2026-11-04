import { useEffect, useState } from "react";
import { footballApi } from "./api";
import type { Credentials } from "./types";

export function FootballTokenSettings({ credentials, onSaved }: {
  credentials: Credentials;
  onSaved: () => void;
}) {
  const [configured, setConfigured] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    footballApi.tokenStatus(credentials)
      .then((status) => { if (active) setConfigured(status.configured); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to check football token"); });
    return () => { active = false; };
  }, [credentials]);

  const save = async () => {
    setBusy(true); setError("");
    try {
      await footballApi.saveToken(credentials, token);
      setToken(""); setConfigured(true); onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save football token");
    } finally { setBusy(false); }
  };

  return <section className="football-token-panel">
    <div>
      <p className="eyebrow">FOOTBALL INTEGRATION</p>
      <h2>Football API token</h2>
      <p>{configured ? "Token saved and encrypted in Neon. Enter a new token to replace it." : "Save your football-data.org API token to load competitions, teams, fixtures, and scores."}</p>
      {error && <small className="field-error">{error}</small>}
    </div>
    <div className="football-token">
      <label>API token<input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder={configured ? "Enter replacement token" : "Enter football-data.org token"} /></label>
      <button className="button secondary" type="button" disabled={busy || !token.trim()} onClick={save}>{busy ? "Saving…" : "Save token"}</button>
    </div>
  </section>;
}
