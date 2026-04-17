// Pure CSS vote bars — no Chart.js needed
import { useState, useEffect } from 'react';

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
  // Trigger bar animations after mount so they visibly fill in
  const [barsReady, setBarsReady] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!selectedMatch) return;
    const handler = e => e.key === 'Escape' && setSelectedMatch(null);
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedMatch]);

  if (!upcomingMatches.length) {
    return (
      <div className="bg-surface border border-stroke rounded-2xl p-10 text-center">
        <p className="text-3xl mb-3">🏟️</p>
        <p className="text-sm font-medium text-slate-400">No upcoming matches right now</p>
        <p className="text-xs text-slate-400 mt-1">Predictions will appear here once the next match is announced</p>
      </div>
    );
  }

  const liveMatches     = upcomingMatches.filter(m => m.isOngoing);
  const nonLiveMatches  = upcomingMatches.filter(m => !m.isOngoing);

  return (
    <div className="space-y-4">
      {/* ── Live matches — full-width expanded cards ── */}
      {liveMatches.map((match, idx) => (
        <LiveMatchCard key={`live-${idx}`} match={match} barsReady={barsReady} />
      ))}

      {/* ── Upcoming matches — compact grid ── */}
      {nonLiveMatches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nonLiveMatches.map((match, idx) => (
            <UpcomingCard
              key={`up-${idx}`}
              match={match}
              barsReady={barsReady}
              onSelect={() => setSelectedMatch(match)}
            />
          ))}
        </div>
      )}

      {selectedMatch && (
        <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}

/* ── Detail modal for upcoming cards ── */
function MatchDetailModal({ match, onClose }) {
  const [barsReady, setBarsReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const teams  = match.Teams.split(' vs ').map(t => t.trim());
  const pct    = match.percentages || {};
  const voters = match.voterNames  || {};
  const aVal   = parseFloat(pct[teams[0]] || 0);
  const bVal   = parseFloat(pct[teams[1]] || 0);
  const aColor = teamColor(teams[0]);
  const bColor = teamColor(teams[1]);
  const votes  = match.totalVotes || 0;
  const aNames = voters[teams[0]] || [];
  const bNames = voters[teams[1]] || [];
  const hours  = hoursUntil(match.start_time_iso);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-stroke rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-stroke flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-slate-400">{match['Match ID']} · {match.Venue}</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-raised flex items-center justify-center text-muted hover:text-slate-200 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center py-1">
            <p className="text-xl font-bold tracking-tight">
              <span style={{ color: aColor }}>{teams[0]}</span>
              <span className="text-slate-400 mx-3 font-normal text-base">vs</span>
              <span style={{ color: bColor }}>{teams[1]}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {formatTime(match.start_time_iso)} · {hours < 1 ? 'Starting soon' : `${hours}h away`} · {votes} prediction{votes !== 1 ? 's' : ''}
            </p>
          </div>

          {votes === 0 ? (
            <p className="text-[10px] text-slate-400 text-center py-2">No predictions submitted yet</p>
          ) : (
            <>
              <div className="space-y-2">
                <LiveVoteBar team={teams[0]} pct={aVal} color={aColor} ready={barsReady} />
                <LiveVoteBar team={teams[1]} pct={bVal} color={bColor} ready={barsReady} />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <SupporterColumn team={teams[0]} color={aColor} names={aNames} pct={aVal} />
                <SupporterColumn team={teams[1]} color={bColor} names={bNames} pct={bVal} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Live match card — expanded with all names as pills ── */
function LiveMatchCard({ match, barsReady }) {
  const teams  = match.Teams.split(' vs ').map(t => t.trim());
  const pct    = match.percentages || {};
  const voters = match.voterNames  || {};
  const aVal   = parseFloat(pct[teams[0]] || 0);
  const bVal   = parseFloat(pct[teams[1]] || 0);
  const aColor = teamColor(teams[0]);
  const bColor = teamColor(teams[1]);
  const votes  = match.totalVotes || 0;
  const aNamen = voters[teams[0]] || [];
  const bNames = voters[teams[1]] || [];

  return (
    <div className="bg-surface border-2 border-leaf/50 rounded-2xl p-5 space-y-4 shadow-[0_0_24px_rgba(34,197,94,0.08)]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-slate-400">{match['Match ID']} · {match.Venue}</span>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-leaf bg-leaf/10 border border-leaf/25 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />
          LIVE NOW
        </span>
      </div>

      {/* Teams headline */}
      <div className="text-center py-1">
        <p className="text-xl font-bold tracking-tight">
          <span style={{ color: aColor }}>{teams[0]}</span>
          <span className="text-slate-400 mx-3 font-normal text-base">vs</span>
          <span style={{ color: bColor }}>{teams[1]}</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-1">{formatTime(match.start_time_iso)} · {votes} prediction{votes !== 1 ? 's' : ''}</p>
      </div>

      {votes === 0 ? (
        <p className="text-[10px] text-slate-400 text-center py-2">No predictions were submitted for this match</p>
      ) : (
        <>
          {/* Vote bars */}
          <div className="space-y-2">
            <LiveVoteBar team={teams[0]} pct={aVal} color={aColor} ready={barsReady} />
            <LiveVoteBar team={teams[1]} pct={bVal} color={bColor} ready={barsReady} />
          </div>

          {/* Side-by-side name columns */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <SupporterColumn team={teams[0]} color={aColor} names={aNamen} pct={aVal} />
            <SupporterColumn team={teams[1]} color={bColor} names={bNames} pct={bVal} />
          </div>
        </>
      )}
    </div>
  );
}

function LiveVoteBar({ team, pct, color, ready }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold w-10 flex-shrink-0 truncate" style={{ color }}>{team}</span>
      <div className="flex-1 h-2 bg-raised rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: ready ? `${pct}%` : '0%', backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-9 text-right flex-shrink-0" style={{ color }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function SupporterColumn({ team, color, names, pct }) {
  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ backgroundColor: `${color}0d`, border: `1px solid ${color}20` }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold" style={{ color }}>{team}</span>
        <span className="text-[10px] text-slate-400">{names.length} vote{names.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Name pills */}
      {names.length === 0 ? (
        <p className="text-[10px] text-slate-400 italic">No predictions</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {names.map((name, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Regular upcoming match card (unchanged) ── */
function UpcomingCard({ match, barsReady, onSelect }) {
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
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left bg-surface border border-stroke rounded-2xl p-4 space-y-4 hover:bg-raised hover:border-brand/40 transition-colors cursor-pointer"
    >
      {/* Match ID + urgency */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-slate-400">{match['Match ID']}</span>
        {soon ? (
          <span className="text-[10px] font-semibold text-brand bg-brand/10 border border-brand/20 rounded-full px-2 py-0.5">
            Soon
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{match.Venue}</span>
        )}
      </div>

      {/* Teams */}
      <div className="text-center">
        <p className="text-base font-bold tracking-tight">
          <span style={{ color: aColor }}>{teams[0]}</span>
          <span className="text-slate-400 mx-2 font-normal text-sm">vs</span>
          <span style={{ color: bColor }}>{teams[1]}</span>
        </p>
        {soon && <p className="text-[10px] text-slate-400 mt-0.5">{match.Venue}</p>}
      </div>

      {/* Vote bars */}
      <div className="space-y-3">
        <VoteBar team={teams[0]} pct={aVal} color={aColor} voterNames={voters[teams[0]] || []} ready={barsReady} />
        <VoteBar team={teams[1]} pct={bVal} color={bColor} voterNames={voters[teams[1]] || []} ready={barsReady} />
      </div>

      {/* Footer */}
      <div className="pt-1 border-t border-stroke flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{formatTime(match.start_time_iso)}</span>
        <span className={`text-[10px] ${soon ? 'text-brand font-medium' : 'text-slate-400'}`}>
          {hours < 1 ? 'Starting now' : `${hours}h away`}
          {votes > 0 && ` · ${votes} votes`}
        </span>
      </div>
    </button>
  );
}

/* ── Compact vote bar (used in upcoming cards) ── */
function VoteBar({ team, pct, color, voterNames, ready }) {
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
            style={{ width: ready ? `${pct}%` : '0%', backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-slate-400 w-9 text-right flex-shrink-0 tabular-nums">{pct.toFixed(0)}%</span>
      </div>
      {shown.length > 0 && (
        <p className="text-[10px] text-slate-400 pl-12 truncate">
          {shown.join(', ')}{extra > 0 ? ` +${extra} more` : ''}
        </p>
      )}
    </div>
  );
}
