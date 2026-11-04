import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, Check, ExternalLink, Music2 } from "lucide-react";
import { integrationsApi, type OAuthStatus } from "./api";
import type { Credentials } from "./types";

const EMPTY_STATUS: OAuthStatus = { connected: false, expiresAt: null, scopes: null };

export function OAuthIntegrations({ credentials }: { credentials: Credentials }) {
  const [statuses, setStatuses] = useState({ spotify: EMPTY_STATUS, google: EMPTY_STATUS });
  const [busy, setBusy] = useState<"spotify" | "google" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = () => integrationsApi.status(credentials).then(setStatuses);

  useEffect(() => {
    let active = true;
    integrationsApi.status(credentials)
      .then((result) => { if (active) setStatuses(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load integrations"); });
    const receiveOAuth = (event: MessageEvent) => {
      const data = event.data as { type?: string; status?: string; message?: string };
      if (data?.type !== "p4-oauth") return;
      if (data.status === "connected") {
        setMessage(data.message ?? "Account connected");
        setError("");
        refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to refresh integrations"));
      } else setError(data.message ?? "Authorization failed");
      setBusy(null);
    };
    window.addEventListener("message", receiveOAuth);
    return () => { active = false; window.removeEventListener("message", receiveOAuth); };
    // `credentials` identifies the authenticated dashboard session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials]);

  const connect = async (provider: "spotify" | "google") => {
    setBusy(provider); setError(""); setMessage("");
    const popup = window.open("", "p4-oauth", "popup=yes,width=620,height=760");
    try {
      const { authorizationUrl } = await integrationsApi.authorize(credentials, provider);
      if (popup) popup.location.assign(authorizationUrl);
      else window.location.assign(authorizationUrl);
    } catch (cause) {
      popup?.close();
      setError(cause instanceof Error ? cause.message : `Unable to connect ${provider}`);
      setBusy(null);
    }
  };

  const integration = (
    provider: "spotify" | "google",
    name: string,
    description: string,
    icon: ReactNode,
  ) => {
    const status = statuses[provider];
    return <article className={`oauth-card ${status.connected ? "connected" : ""}`}>
      <span className="oauth-icon">{icon}</span>
      <div><strong>{name}</strong><p>{description}</p><small>{status.connected ? <><Check size={12} /> Connected</> : "Not connected"}</small></div>
      <button className="button secondary" disabled={busy !== null} onClick={() => connect(provider)}>
        <ExternalLink size={15} />{busy === provider ? "Opening…" : status.connected ? "Reconnect" : "Connect"}
      </button>
    </article>;
  };

  return <section className="oauth-panel">
    <div className="oauth-heading"><p className="eyebrow">ACCOUNT INTEGRATIONS</p><h2>Google & Spotify</h2><p>Authorize dashboard access without exposing provider tokens to the browser or ESP.</p></div>
    <div className="oauth-grid">
      {integration("spotify", "Spotify", "Currently playing music", <Music2 size={20} />)}
      {integration("google", "Google Calendar", "Upcoming calendar events", <CalendarDays size={20} />)}
    </div>
    {(message || error) && <small className={error ? "field-error oauth-feedback" : "oauth-success"}>{message || error}</small>}
  </section>;
}
