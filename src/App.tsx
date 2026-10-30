import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, Check, ChevronDown, ChevronUp, CirclePlus, Cloud,
  LoaderCircle, LogOut, RefreshCw, Save, Settings2, Trash2, Zap,
} from "lucide-react";
import { ApiError, configurationApi } from "./api";
import type { Credentials, DashboardConfiguration, DashboardModule } from "./types";

const FOCUS_MODULE_ID = "focus-countdown";
const ANIMATION_IDS = [
  "asteroid-earth", "aquarium", "campfire", "cat-and-fly", "dragon-eye",
  "earth-and-sun", "messi-barca", "moon-stars", "moving-car", "moving-stars",
  "sleepy-cat", "solar-system",
] as const;

function createModule(): DashboardModule {
  return {
    moduleId: `new-module-${Date.now().toString().slice(-6)}`,
    name: "New module",
    enabled: false,
    duration: 5000,
    dataSource: "api",
    payload: {},
    display: { mode: "single", renderer: "text" },
    config: {},
  };
}

function Login({ onConnect, loading, error }: {
  onConnect: (credentials: Credentials) => void;
  loading: boolean;
  error: string;
}) {
  const [username, setUsername] = useState(localStorage.getItem("p4.username") ?? "");
  const [password, setPassword] = useState("");

  return <main className="login-shell">
    <section className="login-card">
      <div className="brand-mark"><Zap size={22} fill="currentColor" /></div>
      <p className="eyebrow">P4 CONTROL PLANE</p>
      <h1>Configuration<br />Studio</h1>
      <p className="muted">Connect securely to your dashboard API and shape what appears on your display.</p>
      <form onSubmit={(event) => {
        event.preventDefault();
        localStorage.setItem("p4.username", username);
        onConnect({ username, password });
      }}>
        <label>Username<input autoFocus required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Dashboard username" /></label>
        <label>Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" /></label>
        {error && <p className="form-error"><AlertCircle size={15} />{error}</p>}
        <button className="button primary wide" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : <Cloud size={18} />}
          {loading ? "Connecting…" : "Connect to configuration"}
        </button>
      </form>
      <p className="security-note">Credentials stay in this browser tab. Your password is never stored.</p>
    </section>
  </main>;
}

function JsonField({ label, value, onChange, required = false }: {
  label: string;
  value: Record<string, unknown> | undefined;
  onChange: (value: Record<string, unknown> | undefined) => void;
  required?: boolean;
}) {
  const [text, setText] = useState(JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      if (JSON.stringify(JSON.parse(text)) === JSON.stringify(value ?? {})) return;
    } catch { /* Replace invalid local text when the parent is reloaded. */ }
    setText(JSON.stringify(value ?? {}, null, 2));
    setError("");
    // `text` is deliberately omitted: local typing must not reset the cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <label className="json-field">
    <span>{label}<small> JSON object</small></span>
    <textarea spellCheck={false} className={error ? "invalid" : ""} value={text} onChange={(event) => {
      const next = event.target.value;
      setText(next);
      try {
        const parsed: unknown = JSON.parse(next);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Enter a JSON object");
        setError("");
        const object = parsed as Record<string, unknown>;
        onChange(!required && Object.keys(object).length === 0 ? undefined : object);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Invalid JSON");
      }
    }} />
    {error && <small className="field-error">{error}</small>}
  </label>;
}

function ModuleCard({ module, index, expanded, onExpand, onChange, onRemove }: {
  module: DashboardModule;
  index: number;
  expanded: boolean;
  onExpand: () => void;
  onChange: (module: DashboardModule) => void;
  onRemove: () => void;
}) {
  const update = <K extends keyof DashboardModule>(key: K, value: DashboardModule[K]) => onChange({ ...module, [key]: value });
  const isFocus = module.moduleId === FOCUS_MODULE_ID;
  const isAnimation = module.display?.renderer === "animation";

  return <article className={`module-card ${module.enabled ? "active" : ""} ${isFocus ? "focus" : ""}`}>
    <button className="card-summary" onClick={onExpand} type="button">
      <span className="drag-index">{String(index + 1).padStart(2, "0")}</span>
      <span className="module-icon">{isFocus ? <Zap size={18} /> : <Settings2 size={18} />}</span>
      <span className="module-title"><strong>{module.name || "Untitled module"}</strong><small>{module.moduleId}</small></span>
      {isFocus && <span className="focus-pill">FOCUS</span>}
      <span className={`status ${module.enabled ? "on" : ""}`}><i />{module.enabled ? "Active" : "Off"}</span>
      {expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
    </button>
    {expanded && <div className="card-body">
      <div className="toggle-row">
        <div><strong>Module enabled</strong><small>Control this module independently.</small></div>
        <label className="switch"><input type="checkbox" checked={module.enabled} onChange={(e) => update("enabled", e.target.checked)} /><span /></label>
      </div>
      <div className="field-grid">
        <label>Name<input value={module.name} onChange={(e) => update("name", e.target.value)} /></label>
        <label>Module ID<input value={module.moduleId} onChange={(e) => update("moduleId", e.target.value)} /></label>
        <label>Duration <small>ms</small><input min="1" type="number" value={module.duration} onChange={(e) => update("duration", Number(e.target.value))} /></label>
        <label>Refresh time <small>ms, optional</small><input min="1" type="number" value={module.refreshTime ?? ""} onChange={(e) => update("refreshTime", e.target.value ? Number(e.target.value) : undefined)} /></label>
        <label>City <small>optional</small><input value={module.city ?? ""} onChange={(e) => update("city", e.target.value || undefined)} /></label>
        <label>Data source<select value={module.dataSource ?? "api"} onChange={(e) => {
          const dataSource = e.target.value as "api" | "configuration";
          onChange({ ...module, dataSource, staticData: dataSource === "configuration" ? (module.staticData ?? { text: "Your message" }) : undefined });
        }}><option value="api">Backend API</option><option value="configuration">Configuration (no API call)</option></select></label>
        {isAnimation && <label>Animation<select value={typeof module.staticData?.animationId === "string" ? module.staticData.animationId : "campfire"} onChange={(e) => update("staticData", { ...module.staticData, animationId: e.target.value })}>
          {ANIMATION_IDS.map((animationId) => <option key={animationId} value={animationId}>{animationId}</option>)}
        </select></label>}
      </div>
      <div className="json-grid">
        {module.dataSource === "configuration" && !isAnimation && <JsonField label="Static data" required value={module.staticData} onChange={(value) => update("staticData", value ?? {})} />}
        <JsonField label="Schedule" value={module.schedule} onChange={(value) => update("schedule", value as DashboardModule["schedule"])} />
        <JsonField label="Payload" value={module.payload} onChange={(value) => update("payload", value)} />
        <JsonField label="Display" value={module.display} onChange={(value) => update("display", value as DashboardModule["display"])} />
        <JsonField label="Module config" required value={module.config} onChange={(value) => update("config", value ?? {})} />
        <JsonField label="State mapping" value={module.stateMapping} onChange={(value) => update("stateMapping", value as DashboardModule["stateMapping"])} />
      </div>
      <button className="delete-button" type="button" onClick={onRemove}><Trash2 size={16} /> Remove module</button>
    </div>}
  </article>;
}

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [configuration, setConfiguration] = useState<DashboardConfiguration | null>(null);
  const [baseline, setBaseline] = useState<DashboardConfiguration | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = useMemo(() => configuration && baseline ? JSON.stringify(configuration) !== JSON.stringify(baseline) : false, [configuration, baseline]);

  const load = async (auth: Credentials) => {
    setLoading(true); setError("");
    try {
      const next = await configurationApi.get(auth);
      setCredentials(auth); setConfiguration(next); setBaseline(structuredClone(next));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load configuration");
    } finally { setLoading(false); }
  };

  if (!credentials || !configuration) return <Login onConnect={load} loading={loading} error={error} />;

  const changeModule = (index: number, next: DashboardModule) => {
    const modules = configuration.modules.map((item, itemIndex) => itemIndex === index ? next : item);
    setConfiguration({ ...configuration, modules });
  };

  const save = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      const next = await configurationApi.update(credentials, configuration.version, configuration.brightness, configuration.modules);
      setConfiguration(next); setBaseline(structuredClone(next));
      setNotice(`Version ${next.version} is live in Neon.`);
      setTimeout(() => setNotice(""), 4000);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) setError("This configuration changed elsewhere. Reload it before saving again.");
      else setError(cause instanceof Error ? cause.message : "Unable to save configuration");
    } finally { setSaving(false); }
  };

  return <div className="app-shell">
    <header>
      <div className="brand"><span><Zap size={17} fill="currentColor" /></span><div><strong>P4</strong><small>CONFIGURATION STUDIO</small></div></div>
      <div className="header-actions">
        <span className="version-badge">NEON · V{configuration.version}</span>
        <button className="icon-button" title="Reload from Neon" disabled={loading} onClick={() => load(credentials)}><RefreshCw className={loading ? "spin" : ""} size={18} /></button>
        <button className="icon-button" title="Sign out" onClick={() => { setCredentials(null); setConfiguration(null); setError(""); }}><LogOut size={18} /></button>
      </div>
    </header>
    <main className="content">
      <section className="hero">
        <div><p className="eyebrow">DASHBOARD ORCHESTRATION</p><h1>Your modules,<br /><em>beautifully configured.</em></h1><p>Changes are saved directly through the backend to your versioned Neon configuration.</p></div>
        <div className="stat-panel"><div><strong>{configuration.modules.length}</strong><small>MODULES</small></div><div><strong>{configuration.modules.filter((item) => item.enabled).length}</strong><small>ACTIVE</small></div><div><strong>v{configuration.version}</strong><small>VERSION</small></div></div>
      </section>
      {(error || notice) && <div className={`toast ${notice ? "success" : "error"}`}>{notice ? <Check size={18} /> : <AlertCircle size={18} />}{notice || error}</div>}
      <section className="brightness-panel">
        <div><p className="eyebrow">DISPLAY SETTINGS</p><h2>Panel brightness</h2><p>Set the LED panel output intensity.</p></div>
        <div className="brightness-control">
          <strong>{configuration.brightness}%</strong>
          <input aria-label="Panel brightness" type="range" min="0" max="100" step="1" value={configuration.brightness} onChange={(event) => setConfiguration({ ...configuration, brightness: Number(event.target.value) })} />
          <div><span>0</span><span>100</span></div>
        </div>
      </section>
      <section className="section-heading"><div><p className="eyebrow">CONFIGURATION OBJECTS</p><h2>Display modules</h2></div><button className="button secondary" onClick={() => { setConfiguration({ ...configuration, modules: [...configuration.modules, createModule()] }); setExpanded(configuration.modules.length); }}><CirclePlus size={18} /> Add object</button></section>
      <div className="modules">
        {configuration.modules.map((module, index) => <ModuleCard key={`${index}-${module.moduleId}`} module={module} index={index} expanded={expanded === index} onExpand={() => setExpanded(expanded === index ? null : index)} onChange={(next) => changeModule(index, next)} onRemove={() => { setConfiguration({ ...configuration, modules: configuration.modules.filter((_, i) => i !== index) }); setExpanded(null); }} />)}
      </div>
      <div className="save-bar">
        <div><i className={dirty ? "dirty" : ""} /><span>{dirty ? "Unsaved changes" : "Configuration is up to date"}</span></div>
        <button className="button ghost" disabled={!dirty || saving || !baseline} onClick={() => baseline && setConfiguration(structuredClone(baseline))}>Discard</button>
        <button className="button primary" disabled={!dirty || saving} onClick={save}>{saving ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}{saving ? "Saving…" : "Publish configuration"}</button>
      </div>
    </main>
  </div>;
}
