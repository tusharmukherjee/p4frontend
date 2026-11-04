import { useEffect, useMemo, useState } from "react";
import { footballApi, type FootballCompetition, type FootballTeam } from "./api";
import type { Credentials, DashboardModule } from "./types";

export function FootballEditor({ credentials, module, onChange, tokenVersion }: {
  credentials: Credentials;
  module: DashboardModule;
  onChange: (next: DashboardModule) => void;
  tokenVersion: number;
}) {
  const code = typeof module.payload?.competitionCode === "string" ? module.payload.competitionCode : "";
  const teamId = typeof module.payload?.teamId === "number" ? module.payload.teamId : 0;
  const [configured, setConfigured] = useState(false);
  const [competitions, setCompetitions] = useState<FootballCompetition[]>([]);
  const [teams, setTeams] = useState<FootballTeam[]>([]);
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");
  const countries = useMemo(() => [...new Set(competitions.map((item) => item.area.name))].sort(), [competitions]);

  useEffect(() => {
    let active = true;
    footballApi.tokenStatus(credentials).then(async (status) => {
      if (!active) return;
      setConfigured(status.configured);
      if (status.configured) {
        const result = await footballApi.competitions(credentials);
        if (active) setCompetitions(result.competitions);
      }
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load football data"); });
    return () => { active = false; };
  }, [credentials, tokenVersion]);

  useEffect(() => {
    const selected = competitions.find((item) => item.code === code);
    if (selected) setCountry(selected.area.name);
  }, [competitions, code]);

  useEffect(() => {
    let active = true;
    if (code && configured) {
      footballApi.teams(credentials, code)
        .then((result) => { if (active) { setTeams(result.teams); setError(""); } })
        .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load teams"); });
    } else setTeams([]);
    return () => { active = false; };
  }, [credentials, code, configured]);

  const setSelection = (competitionCode: string, selectedTeamId: number) => {
    onChange({ ...module, payload: { ...module.payload, competitionCode, teamId: selectedTeamId } });
  };

  return <fieldset className="football-editor">
    <legend>Football</legend>
    <p>Choose a competition to find your team. The display shows that team's next match and live score across all competitions.</p>
    {!configured && <small className="football-status">Save the API token in Football integration above to load choices.</small>}
    <div className="football-selectors">
      <label>Country / region<select disabled={!configured} value={country} onChange={(event) => { setCountry(event.target.value); setSelection("", 0); }}>
        <option value="">Select country</option>
        {countries.map((name) => <option key={name} value={name}>{name}</option>)}
      </select></label>
      <label>Competition (team picker)<select disabled={!country} value={code} onChange={(event) => setSelection(event.target.value, 0)}>
        <option value="">Select competition</option>
        {competitions.filter((item) => item.area.name === country).map((item) => <option key={item.id} value={item.code}>{item.name} ({item.code})</option>)}
      </select></label>
      <label>Team<select disabled={!code} value={teamId || ""} onChange={(event) => setSelection(code, Number(event.target.value))}>
        <option value="">Select team</option>
        {[...teams].sort((a, b) => a.name.localeCompare(b.name)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
    </div>
    {error && <small className="field-error">{error}</small>}
  </fieldset>;
}
