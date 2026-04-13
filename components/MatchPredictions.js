// Pure CSS vote bars — no Chart.js needed

// Primary jersey colors — sourced from official IPL 2026 team cards
const TEAM_COLORS = {
  MI:   '#1375BB',
  CSK:  '#F0C30F',
  RCB:  '#D41E26',
  KKR:  '#8A63B4',
  DC:   '#4B7BC3',
  RR:   '#FF2D8B',
  SRH:  '#F26522',
  PBKS: '#E03A3E',
  GT:   '#B5975A',
  LSG:  '#BE3250',
};

function teamColor(name) {
  const key = Object.keys(TEAM_COLORS).find(k => name.includes(k));
  return key ? TEAM_COLORS[key] : '#6366F1';
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

function hoursUntil(iso) {
  return Math.floor((new Date(iso) - Date.now()) / (1000 * 60 * 60));
}

export default function MatchPredictions({ upcomingMatches }) {
  if (!upcomingMatches.length) {
    return (
      <div className="bg-surface border border-stroke rounded-2xl p-10 text-center">
        <p className="text-3xl mb-3">🏟️</p>
        <p className="text-sm font-medium text-slate-400">No upcoming matches right now</p>
        <p className="text-xs text-slate-600 mt-1">Predictions will appear here once the next match is announced</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {upcomingMatches.map((match, idx) => {
        const teams  = match.Teams.split(' vs ').map(t => t.trim());
        const pct    = match.percentages || {};
        const voters = match.voterNames  || {};
        const aVal   = parseFloat(pct[teams[0]] || 0);
        const bVal   = parseFloat(pct[teams[1]] || 0);
        const aColor = teamColor(teams[0]);
        const bColor = teamColor(teams[1]);
        const hours  = hoursUntil(match.start_time_iso);
        const soon   = hours >= 0 && hours < 6;
        const votes  = match.totalVotes || 0;

        return (
          <div
            key={idx}
            className="bg-surface border border-stroke rounded-2xl p-4 space-y-4 hover:bg-raised transition-colors"
          >
            {/* Match ID + urgency */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-slate-600">{match['Match ID']}</span>
              {soon ? (
                <span className="text-[10px] font-semibold text-brand bg-brand/10 border border-brand/20 rounded-full px-2 py-0.5">
                  Soon
                </span>
              ) : (
                <span className="text-[10px] text-slate-600 truncate max-w-[120px]">{match.Venue}</span>
              )}
            </div>

            {/* Teams */}
            <div className="text-center">
              <p className="text-base font-bold tracking-tight">
                <span style={{ color: aColor }}>{teams[0]}</span>
                <span className="text-slate-600 mx-2 font-normal text-sm">vs</span>
                <span style={{ color: bColor }}>{teams[1]}</span>
              </p>
              {soon && <p className="text-[10px] text-slate-600 mt-0.5">{match.Venue}</p>}
            </div>

            {/* Vote bars */}
            <div className="space-y-3">
              <VoteBar
                team={teams[0]}
                pct={aVal}
                color={aColor}
                voterNames={voters[teams[0]] || []}
              />
              <VoteBar
                team={teams[1]}
                pct={bVal}
                color={bColor}
                voterNames={voters[teams[1]] || []}
              />
            </div>

            {/* Footer */}
            <div className="pt-1 border-t border-stroke flex items-center justify-between">
              <span className="text-[10px] text-slate-600">{formatTime(match.start_time_iso)}</span>
              <span className={`text-[10px] ${soon ? 'text-brand font-medium' : 'text-slate-600'}`}>
                {hours < 0 ? 'Underway' : hours < 1 ? 'Starting now' : `${hours}h away`}
                {votes > 0 && ` · ${votes} votes`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VoteBar({ team, pct, color, voterNames }) {
  const MAX_SHOWN = 3;
  const shown = voterNames.slice(0, MAX_SHOWN);
  const extra = voterNames.length - MAX_SHOWN;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-400 w-10 flex-shrink-0 truncate">{team}</span>
        <div className="flex-1 h-1.5 bg-raised rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-slate-500 w-9 text-right flex-shrink-0 tabular-nums">{pct.toFixed(0)}%</span>
      </div>
      {shown.length > 0 && (
        <p className="text-[10px] text-slate-600 pl-12 truncate">
          {shown.join(', ')}{extra > 0 ? ` +${extra} more` : ''}
        </p>
      )}
    </div>
  );
}
